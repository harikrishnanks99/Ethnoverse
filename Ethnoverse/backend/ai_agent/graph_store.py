import os
from neo4j import GraphDatabase
from typing import List, Dict, Any

class GraphStore:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        user = os.getenv("NEO4J_USER", "")
        password = os.getenv("NEO4J_PASSWORD", "")
        
        if user and password:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
        else:
            self.driver = GraphDatabase.driver(uri)

    def close(self):
        self.driver.close()

    def add_extraction_result(self, extraction_result: Dict[str, Any], community_id: str, content_id: str, text_content: str = "", content_type: str = "text", file_url: str = None):
        """
        Ingests entities and relationships into the graph, tagged by community_id.
        """
        """
        Ingests entities and relationships into the graph, tagged by community_id.
        """
        if extraction_result is None:
            extraction_result = {}


        # Handle both direct dict and pydantic model serialization if needed
        # Check if "knowledge_graph" key exists, otherwise assume extraction_result IS the KG
        kg = extraction_result.get("knowledge_graph", extraction_result)
        
        entities = kg.get("entities", [])
        relationships = kg.get("relationships", [])

        # Sanitize community_id for use in labels (simple alphanumeric check)
        safe_community_id = "".join(x for x in str(community_id) if x.isalnum())
        if not safe_community_id:
            safe_community_id = "DefaultCommunity"

        with self.driver.session() as session:
            # 1. Merge Content Node (Always do this, even if no entities)
            session.execute_write(self._merge_content_node, content_id, safe_community_id, text_content, content_type, file_url)

            # 2. Merge Entities
            for entity in entities:
                session.execute_write(self._merge_entity, entity, safe_community_id)
            
            # 3. Merge Relationships
            for rel in relationships:
                session.execute_write(self._merge_relationship, rel, safe_community_id)
            
            # 4. Link Entities to Content
            for entity in entities:
                 session.execute_write(self._link_entity_to_content, entity["name"], content_id, safe_community_id)


    def get_graph_data(self, community_id: str = None):
        """
        Retrieves nodes and relationships for a specific community or all communities.
        """
        with self.driver.session() as session:
            if community_id:
                safe_community_id = "".join(x for x in str(community_id) if x.isalnum())
                if not safe_community_id:
                    safe_community_id = "DefaultCommunity"
                
                # Fetch nodes with specific community label
                # Note: We are fetching Entity nodes mostly, but could fetch Content too if needed.
                # For visualization, let's fetch Entities and their relationships.
                query = (
                    f"MATCH (n:Community_{safe_community_id}) "
                    f"OPTIONAL MATCH (n)-[r]-(m:Community_{safe_community_id}) "
                    f"RETURN n, r, m"
                )
                result = session.run(query)
            else:
                # Fetch all nodes (limit for safety?)
                query = (
                    "MATCH (n) "
                    "OPTIONAL MATCH (n)-[r]-(m) "
                    "RETURN n, r, m LIMIT 1000"
                )
                result = session.run(query)

            nodes = {}
            edges = []

            for record in result:
                n = record["n"]
                m = record["m"]
                r = record["r"]

                if n:
                    nodes[n.element_id] = {
                        "id": n.element_id,
                        "labels": list(n.labels),
                        "properties": dict(n)
                    }
                
                if m:
                    nodes[m.element_id] = {
                        "id": m.element_id,
                        "labels": list(m.labels),
                        "properties": dict(m)
                    }

                if r:
                    edges.append({
                        "id": r.element_id,
                        "source": r.start_node.element_id,
                        "target": r.end_node.element_id,
                        "type": r.type,
                        "properties": dict(r)
                    })

            return {
                "nodes": list(nodes.values()),
                "edges": edges
            }

    @staticmethod
    def _merge_content_node(tx, content_id: str, community_label: str, text_content: str, content_type: str, file_url: str):
        query = (
             f"MERGE (c:Content {{id: $content_id}}) "
             f"SET c.community_id = $community_id, "
             f"    c.text_content = $text_content, "
             f"    c.content_type = $content_type, "
             f"    c.file_url = $file_url "
             f"SET c :Community_{community_label}"
        )
        tx.run(query, content_id=content_id, community_id=community_label, text_content=text_content, content_type=content_type, file_url=file_url)

    @staticmethod
    def _merge_entity(tx, entity: Dict, community_label: str):
        # We use a dynamic label for the Community to easily segregate/filter
        query = (
            f"MERGE (e:Entity {{name: $name, community_id: $community_id}}) "
            f"ON CREATE SET e.type = $type "
            f"SET e :Community_{community_label}" 
        )
        tx.run(query, name=entity["name"], type=entity["type"], community_id=community_label)

    @staticmethod
    def _merge_relationship(tx, rel: Dict, community_label: str):
        query = (
            f"MATCH (a:Entity {{name: $source, community_id: $community_id}}) "
            f"MATCH (b:Entity {{name: $target, community_id: $community_id}}) "
            f"MERGE (a)-[r:RELATED_TO {{type: $relation}}]-(b)" 
        )
        tx.run(query, 
               source=rel["source"], 
               target=rel["target"], 
               relation=rel["relation"],
               community_id=community_label)

    @staticmethod
    def _link_entity_to_content(tx, entity_name: str, content_id: str, community_label: str):
        query = (
            f"MATCH (e:Entity {{name: $entity_name, community_id: $community_id}}) "
            f"MATCH (c:Content {{id: $content_id}}) "
            f"MERGE (e)-[:MENTIONED_IN]->(c)"
        )
        tx.run(query, entity_name=entity_name, content_id=content_id, community_id=community_label)

    def search_by_entities(self, entity_names: List[str], community_id: str = None) -> List[Dict[str, Any]]:
        """
        Retrieves Content nodes that mention any of the provided entity names.
        Prioritizes content mentioning multiple entities.
        """
        if not entity_names:
            return []
            
        with self.driver.session() as session:
            safe_community_id = None
            if community_id and community_id.lower() != "global":
                safe_community_id = "".join(x for x in str(community_id) if x.isalnum())
                if not safe_community_id:
                    safe_community_id = "DefaultCommunity"
            
            # Match entities
            query = "UNWIND $entity_names AS entity_name "
            
            if safe_community_id:
                query += f"MATCH (e:Entity:Community_{safe_community_id} {{name: entity_name}}) "
            else:
                query += "MATCH (e:Entity {name: entity_name}) "
                
            # Find linked content
            query += (
                "MATCH (e)-[:MENTIONED_IN]->(c:Content) "
                "RETURN c.id AS content_id, "
                "       c.text_content AS text_content, "
                "       c.content_type AS content_type, "
                "       c.file_url AS file_url, "
                "       count(e) AS match_count "
                "ORDER BY match_count DESC "
                "LIMIT 20"
            )
            
            result = session.run(query, entity_names=entity_names)
            
            documents = []
            for record in result:
                documents.append({
                    "id": record["content_id"],
                    "page_content": record["text_content"],
                    "metadata": {
                        "content_type": record["content_type"],
                        "file_url": record["file_url"],
                        "graph_match_count": record["match_count"]
                    }
                })
                
            return documents
