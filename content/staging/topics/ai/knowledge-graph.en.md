---
title: "Graph Machine Learning: Knowledge Graphs"
description: "Build and apply knowledge graphs: representation, embeddings, and link prediction"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - knowledge graph
  - graph embeddings
  - link prediction
  - knowledge representation
status: imported
origin: old/src/content/docs/datascience/knowledge-graph.en.md
divergence: 0.187
issues: []
legacy:
  category: DataScience
  subcategory: GraphML
  order: 28
  lastUpdated: 2026-01-07
---

Knowledge Graphs (KGs) represent one of the most powerful paradigms for organizing, storing, and reasoning over structured knowledge. They have become fundamental infrastructure for search engines, recommendation systems, question answering, and artificial intelligence applications. This comprehensive guide explores knowledge graph concepts, embedding techniques, and practical applications.

---

## Introduction to Knowledge Graphs

### What is a Knowledge Graph?

A Knowledge Graph is a structured representation of real-world entities and their relationships, organized as a graph where nodes represent entities and edges represent relationships between them. Knowledge graphs enable machines to understand and reason about the world in a way that mirrors human cognitive processes.

**Key characteristics of Knowledge Graphs:**

- **Entity-centric**: Focus on real-world objects, concepts, and events
- **Relationship-rich**: Capture semantic connections between entities
- **Schema-flexible**: Can accommodate heterogeneous data types
- **Queryable**: Support complex semantic queries
- **Extensible**: Can be continuously enriched with new knowledge

### Historical Context

| Year | Milestone |
|------|-----------|
| 1960s | Semantic networks introduced by Ross Quillian |
| 1980s | Expert systems and ontologies emerge |
| 2001 | Semantic Web vision by Tim Berners-Lee |
| 2012 | Google introduces the term "Knowledge Graph" |
| 2013 | TransE embedding model published |
| 2017-Present | Deep learning integration, neural KG embeddings |

### Major Knowledge Graphs

| Knowledge Graph | Domain | Size | Features |
|----------------|--------|------|----------|
| **Google Knowledge Graph** | General | 500B+ facts | Powers Google Search |
| **Wikidata** | General | 100M+ items | Open, community-driven |
| **DBpedia** | Wikipedia | 4.5M+ entities | Structured Wikipedia |
| **Freebase** | General | 2.4B+ facts | Deprecated, merged into Wikidata |
| **YAGO** | General | 10M+ entities | High precision |
| **ConceptNet** | Common sense | 34M assertions | Common sense reasoning |
| **UMLS** | Medical | 3M+ concepts | Healthcare domain |

```python
# Example: Exploring Wikidata using SPARQLWrapper
from SPARQLWrapper import SPARQLWrapper, JSON

def query_wikidata(query: str) -> list:
    """Query Wikidata knowledge graph using SPARQL"""
    sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)

    results = sparql.query().convert()
    return results["results"]["bindings"]

# Query: Find all programming languages and their designers
query = """
SELECT ?language ?languageLabel ?designer ?designerLabel
WHERE {
    ?language wdt:P31 wd:Q9143;  # instance of programming language
              wdt:P178 ?designer.  # developer
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 10
"""

results = query_wikidata(query)
for result in results:
    print(f"{result['languageLabel']['value']} - {result['designerLabel']['value']}")
```

---

## Knowledge Representation

### Triple Representation

The fundamental unit of knowledge in a KG is the **triple**, also known as a fact or statement:

$$\text{Triple} = (h, r, t) = (\text{head entity}, \text{relation}, \text{tail entity})$$

**Examples:**

| Head (h) | Relation (r) | Tail (t) |
|----------|--------------|----------|
| Albert Einstein | bornIn | Ulm |
| Python | createdBy | Guido van Rossum |
| Tesla | foundedBy | Elon Musk |
| Paris | capitalOf | France |

```python
from dataclasses import dataclass
from typing import List, Set, Dict, Tuple
import json

@dataclass(frozen=True)
class Triple:
    """Represents a knowledge graph triple (head, relation, tail)"""
    head: str
    relation: str
    tail: str

    def __str__(self) -> str:
        return f"({self.head}, {self.relation}, {self.tail})"

    def to_dict(self) -> dict:
        return {"head": self.head, "relation": self.relation, "tail": self.tail}


class KnowledgeGraph:
    """Simple Knowledge Graph implementation"""

    def __init__(self):
        self.triples: Set[Triple] = set()
        self.entities: Set[str] = set()
        self.relations: Set[str] = set()

        # Indexes for efficient querying
        self._head_index: Dict[str, Set[Triple]] = {}
        self._tail_index: Dict[str, Set[Triple]] = {}
        self._relation_index: Dict[str, Set[Triple]] = {}

    def add_triple(self, head: str, relation: str, tail: str) -> None:
        """Add a triple to the knowledge graph"""
        triple = Triple(head, relation, tail)

        if triple not in self.triples:
            self.triples.add(triple)
            self.entities.add(head)
            self.entities.add(tail)
            self.relations.add(relation)

            # Update indexes
            self._head_index.setdefault(head, set()).add(triple)
            self._tail_index.setdefault(tail, set()).add(triple)
            self._relation_index.setdefault(relation, set()).add(triple)

    def get_neighbors(self, entity: str) -> List[Tuple[str, str, str]]:
        """Get all triples involving an entity"""
        neighbors = []

        # Entity as head
        for triple in self._head_index.get(entity, []):
            neighbors.append((triple.head, triple.relation, triple.tail))

        # Entity as tail
        for triple in self._tail_index.get(entity, []):
            neighbors.append((triple.head, triple.relation, triple.tail))

        return neighbors

    def query(self, head: str = None, relation: str = None, tail: str = None) -> List[Triple]:
        """Query triples with optional filters"""
        results = self.triples

        if head:
            results = results & self._head_index.get(head, set())
        if relation:
            results = results & self._relation_index.get(relation, set())
        if tail:
            results = results & self._tail_index.get(tail, set())

        return list(results)

    def stats(self) -> dict:
        """Return knowledge graph statistics"""
        return {
            "num_triples": len(self.triples),
            "num_entities": len(self.entities),
            "num_relations": len(self.relations)
        }


# Usage example
kg = KnowledgeGraph()

# Add triples
kg.add_triple("Albert Einstein", "bornIn", "Ulm")
kg.add_triple("Albert Einstein", "workedAt", "Princeton University")
kg.add_triple("Albert Einstein", "wonAward", "Nobel Prize in Physics")
kg.add_triple("Ulm", "locatedIn", "Germany")
kg.add_triple("Princeton University", "locatedIn", "New Jersey")

print(f"KG Stats: {kg.stats()}")
# Output: KG Stats: {'num_triples': 5, 'num_entities': 6, 'num_relations': 4}

print(f"Einstein's neighbors: {kg.get_neighbors('Albert Einstein')}")
```

### RDF and Semantic Web Standards

**Resource Description Framework (RDF)** is the W3C standard for representing knowledge graphs:

```python
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, RDFS, XSD

# Create an RDF graph
g = Graph()

# Define namespaces
EX = Namespace("http://example.org/")
SCHEMA = Namespace("http://schema.org/")

# Add triples using RDF
g.add((EX.AlbertEinstein, RDF.type, SCHEMA.Person))
g.add((EX.AlbertEinstein, SCHEMA.name, Literal("Albert Einstein")))
g.add((EX.AlbertEinstein, SCHEMA.birthDate, Literal("1879-03-14", datatype=XSD.date)))
g.add((EX.AlbertEinstein, SCHEMA.birthPlace, EX.Ulm))
g.add((EX.Ulm, RDF.type, SCHEMA.City))
g.add((EX.Ulm, SCHEMA.name, Literal("Ulm")))
g.add((EX.Ulm, SCHEMA.containedIn, EX.Germany))

# Serialize to different formats
print("Turtle format:")
print(g.serialize(format="turtle"))

# SPARQL Query
query = """
    PREFIX schema: <http://schema.org/>
    PREFIX ex: <http://example.org/>

    SELECT ?name ?birthPlace
    WHERE {
        ?person a schema:Person ;
                schema:name ?name ;
                schema:birthPlace ?place .
        ?place schema:name ?birthPlace .
    }
"""

for row in g.query(query):
    print(f"Name: {row.name}, Birth Place: {row.birthPlace}")
```

### Ontologies and Schema

Ontologies provide the schema layer for knowledge graphs, defining:

- **Classes**: Categories of entities (Person, Place, Organization)
- **Properties**: Relationships between entities
- **Constraints**: Cardinality, domain, range restrictions
- **Hierarchies**: Class and property inheritance

```python
from owlready2 import *

# Create an ontology
onto = get_ontology("http://example.org/onto.owl")

with onto:
    # Define classes
    class Person(Thing): pass
    class Scientist(Person): pass
    class Physicist(Scientist): pass
    class Place(Thing): pass
    class City(Place): pass
    class Country(Place): pass
    class Award(Thing): pass

    # Define properties
    class bornIn(ObjectProperty):
        domain = [Person]
        range = [Place]

    class workedAt(ObjectProperty):
        domain = [Person]
        range = [Thing]

    class locatedIn(ObjectProperty, TransitiveProperty):
        domain = [Place]
        range = [Place]

    class wonAward(ObjectProperty):
        domain = [Person]
        range = [Award]

    class birthDate(DataProperty, FunctionalProperty):
        domain = [Person]
        range = [str]

# Create instances
einstein = Physicist("AlbertEinstein")
ulm = City("Ulm")
germany = Country("Germany")
nobel = Award("NobelPrizePhysics")

einstein.bornIn = [ulm]
einstein.wonAward = [nobel]
ulm.locatedIn = [germany]
einstein.birthDate = "1879-03-14"

# Query using reasoning
sync_reasoner()

print(f"Einstein born in: {einstein.bornIn}")
print(f"Einstein is a: {einstein.is_a}")
```

---

## Knowledge Graph Embeddings

### The Embedding Problem

Knowledge graph embedding (KGE) aims to learn continuous vector representations for entities and relations that preserve the graph's structural and semantic properties.

**Goal**: Learn embedding functions:
- $f_e: \mathcal{E} \rightarrow \mathbb{R}^d$ (entity embeddings)
- $f_r: \mathcal{R} \rightarrow \mathbb{R}^k$ (relation embeddings)

such that for any valid triple $(h, r, t)$, a scoring function $f(h, r, t)$ returns a high score.

### Why Embeddings?

| Challenge | Embedding Solution |
|-----------|-------------------|
| Sparsity | Dense representations capture latent patterns |
| Scalability | Efficient similarity computation |
| Generalization | Predict unseen triples via learned patterns |
| Integration | Bridge symbolic and neural approaches |

### Embedding Framework

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple
import numpy as np

class KGEmbeddingBase(nn.Module):
    """Base class for Knowledge Graph Embedding models"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int,
        margin: float = 1.0
    ):
        super().__init__()
        self.num_entities = num_entities
        self.num_relations = num_relations
        self.embedding_dim = embedding_dim
        self.margin = margin

        # Entity embeddings
        self.entity_embeddings = nn.Embedding(num_entities, embedding_dim)

        # Relation embeddings
        self.relation_embeddings = nn.Embedding(num_relations, embedding_dim)

        # Initialize embeddings
        self._init_embeddings()

    def _init_embeddings(self):
        """Xavier uniform initialization"""
        nn.init.xavier_uniform_(self.entity_embeddings.weight)
        nn.init.xavier_uniform_(self.relation_embeddings.weight)

    def get_embeddings(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Get embeddings for a batch of triples"""
        h = self.entity_embeddings(heads)
        r = self.relation_embeddings(relations)
        t = self.entity_embeddings(tails)
        return h, r, t

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """Calculate score for triples (to be overridden)"""
        raise NotImplementedError

    def loss(
        self,
        positive_triples: torch.Tensor,
        negative_triples: torch.Tensor
    ) -> torch.Tensor:
        """Margin-based ranking loss"""
        pos_scores = self.score(
            positive_triples[:, 0],
            positive_triples[:, 1],
            positive_triples[:, 2]
        )
        neg_scores = self.score(
            negative_triples[:, 0],
            negative_triples[:, 1],
            negative_triples[:, 2]
        )

        # Margin ranking loss
        return torch.relu(self.margin + pos_scores - neg_scores).mean()
```

---

## TransE and Translation-Based Models

### TransE: Translating Embeddings

TransE (Bordes et al., 2013) is the foundational translation-based embedding model. It interprets relations as translations in the embedding space:

$$\mathbf{h} + \mathbf{r} \approx \mathbf{t}$$

For a valid triple $(h, r, t)$, the tail entity should be close to the head entity plus the relation vector.

**Scoring Function:**

$$f(h, r, t) = -\|\mathbf{h} + \mathbf{r} - \mathbf{t}\|_{L_1/L_2}$$

```python
class TransE(KGEmbeddingBase):
    """TransE: Translating Embeddings for Modeling Multi-relational Data"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 100,
        margin: float = 1.0,
        norm: int = 2  # L1 or L2 norm
    ):
        super().__init__(num_entities, num_relations, embedding_dim, margin)
        self.norm = norm

    def _init_embeddings(self):
        """Initialize with normalized embeddings"""
        nn.init.xavier_uniform_(self.entity_embeddings.weight)
        nn.init.xavier_uniform_(self.relation_embeddings.weight)

        # Normalize relation embeddings
        self.relation_embeddings.weight.data = F.normalize(
            self.relation_embeddings.weight.data, p=2, dim=1
        )

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """
        TransE scoring function: -||h + r - t||
        Lower scores indicate more plausible triples
        """
        h, r, t = self.get_embeddings(heads, relations, tails)

        # Normalize entity embeddings
        h = F.normalize(h, p=2, dim=-1)
        t = F.normalize(t, p=2, dim=-1)

        # Calculate distance
        if self.norm == 1:
            score = torch.sum(torch.abs(h + r - t), dim=-1)
        else:
            score = torch.sum((h + r - t) ** 2, dim=-1)

        return score

    def forward(
        self,
        positive_triples: torch.Tensor,
        negative_triples: torch.Tensor
    ) -> torch.Tensor:
        """Forward pass with margin ranking loss"""
        return self.loss(positive_triples, negative_triples)


# Training example
def train_transe(
    model: TransE,
    train_triples: np.ndarray,
    num_epochs: int = 100,
    batch_size: int = 128,
    learning_rate: float = 0.01,
    num_negatives: int = 1
):
    """Train TransE model"""
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    num_entities = model.num_entities

    for epoch in range(num_epochs):
        model.train()
        total_loss = 0

        # Shuffle training data
        np.random.shuffle(train_triples)

        for i in range(0, len(train_triples), batch_size):
            batch = train_triples[i:i + batch_size]
            positive = torch.LongTensor(batch)

            # Generate negative samples by corrupting head or tail
            negative = positive.clone()
            corrupt_head = torch.rand(len(batch)) > 0.5

            for j in range(len(batch)):
                if corrupt_head[j]:
                    negative[j, 0] = np.random.randint(num_entities)
                else:
                    negative[j, 2] = np.random.randint(num_entities)

            optimizer.zero_grad()
            loss = model(positive, negative)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch + 1}, Loss: {total_loss:.4f}")

    return model
```

### TransR: Relation-Specific Spaces

TransR addresses TransE's limitation with complex relations by projecting entities into relation-specific spaces:

$$\mathbf{h}_r = \mathbf{h}\mathbf{M}_r, \quad \mathbf{t}_r = \mathbf{t}\mathbf{M}_r$$

$$f(h, r, t) = -\|\mathbf{h}_r + \mathbf{r} - \mathbf{t}_r\|$$

```python
class TransR(KGEmbeddingBase):
    """TransR: Learning Entity and Relation Embeddings for Knowledge Graph Completion"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        entity_dim: int = 100,
        relation_dim: int = 100,
        margin: float = 1.0
    ):
        super().__init__(num_entities, num_relations, entity_dim, margin)
        self.entity_dim = entity_dim
        self.relation_dim = relation_dim

        # Override relation embeddings with different dimension
        self.relation_embeddings = nn.Embedding(num_relations, relation_dim)

        # Projection matrices for each relation
        self.projection_matrices = nn.Embedding(
            num_relations, entity_dim * relation_dim
        )

        self._init_embeddings()

    def _init_embeddings(self):
        nn.init.xavier_uniform_(self.entity_embeddings.weight)
        nn.init.xavier_uniform_(self.relation_embeddings.weight)

        # Initialize projection matrices as identity-like
        nn.init.xavier_uniform_(self.projection_matrices.weight)

    def _project(
        self,
        entities: torch.Tensor,
        relations: torch.Tensor
    ) -> torch.Tensor:
        """Project entities into relation-specific space"""
        batch_size = entities.size(0)

        # Get projection matrices
        M = self.projection_matrices(relations)
        M = M.view(batch_size, self.entity_dim, self.relation_dim)

        # Project: e_r = e * M_r
        projected = torch.bmm(entities.unsqueeze(1), M).squeeze(1)

        return projected

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """TransR scoring function"""
        h = self.entity_embeddings(heads)
        t = self.entity_embeddings(tails)
        r = self.relation_embeddings(relations)

        # Project to relation space
        h_r = self._project(h, relations)
        t_r = self._project(t, relations)

        # Normalize
        h_r = F.normalize(h_r, p=2, dim=-1)
        t_r = F.normalize(t_r, p=2, dim=-1)
        r = F.normalize(r, p=2, dim=-1)

        # Score
        score = torch.sum((h_r + r - t_r) ** 2, dim=-1)

        return score
```

### TransH: Hyperplane Translation

TransH models relations as translation on relation-specific hyperplanes:

```python
class TransH(KGEmbeddingBase):
    """TransH: Knowledge Graph Embedding by Translating on Hyperplanes"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 100,
        margin: float = 1.0
    ):
        super().__init__(num_entities, num_relations, embedding_dim, margin)

        # Hyperplane normal vectors for each relation
        self.normal_vectors = nn.Embedding(num_relations, embedding_dim)
        nn.init.xavier_uniform_(self.normal_vectors.weight)

    def _project_to_hyperplane(
        self,
        entity: torch.Tensor,
        normal: torch.Tensor
    ) -> torch.Tensor:
        """Project entity onto the hyperplane defined by normal vector"""
        # Normalize the normal vector
        normal = F.normalize(normal, p=2, dim=-1)

        # Project: e_perp = e - (e . n) * n
        dot = torch.sum(entity * normal, dim=-1, keepdim=True)
        projection = entity - dot * normal

        return projection

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """TransH scoring function"""
        h, r, t = self.get_embeddings(heads, relations, tails)
        n = self.normal_vectors(relations)

        # Project entities onto hyperplane
        h_perp = self._project_to_hyperplane(h, n)
        t_perp = self._project_to_hyperplane(t, n)

        # Score
        score = torch.sum((h_perp + r - t_perp) ** 2, dim=-1)

        return score
```

### Translation Model Comparison

| Model | Space | Relation Modeling | Complexity |
|-------|-------|-------------------|------------|
| TransE | Same space | Translation | O(d) |
| TransH | Hyperplane | Translation on hyperplane | O(d) |
| TransR | Relation-specific | Projection + translation | O(d x k) |
| TransD | Dynamic | Dynamic projection | O(d) |
| RotatE | Complex | Rotation | O(d) |

---

## Semantic Matching Models

### ComplEx: Complex Embeddings

ComplEx extends embeddings to complex vector space, enabling asymmetric relation modeling:

$$f(h, r, t) = \text{Re}(\langle \mathbf{h}, \mathbf{r}, \bar{\mathbf{t}} \rangle)$$

where $\bar{\mathbf{t}}$ is the complex conjugate of $\mathbf{t}$.

```python
class ComplEx(nn.Module):
    """ComplEx: Complex Embeddings for Simple Link Prediction"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 100
    ):
        super().__init__()
        self.num_entities = num_entities
        self.num_relations = num_relations
        self.embedding_dim = embedding_dim

        # Real and imaginary parts of entity embeddings
        self.entity_re = nn.Embedding(num_entities, embedding_dim)
        self.entity_im = nn.Embedding(num_entities, embedding_dim)

        # Real and imaginary parts of relation embeddings
        self.relation_re = nn.Embedding(num_relations, embedding_dim)
        self.relation_im = nn.Embedding(num_relations, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        nn.init.xavier_uniform_(self.entity_re.weight)
        nn.init.xavier_uniform_(self.entity_im.weight)
        nn.init.xavier_uniform_(self.relation_re.weight)
        nn.init.xavier_uniform_(self.relation_im.weight)

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """
        ComplEx scoring: Re(<h, r, conj(t)>)
        = Re(h) * Re(r) * Re(t) + Re(h) * Im(r) * Im(t)
        + Im(h) * Re(r) * Im(t) - Im(h) * Im(r) * Re(t)
        """
        h_re = self.entity_re(heads)
        h_im = self.entity_im(heads)
        r_re = self.relation_re(relations)
        r_im = self.relation_im(relations)
        t_re = self.entity_re(tails)
        t_im = self.entity_im(tails)

        score = torch.sum(
            h_re * r_re * t_re +
            h_re * r_im * t_im +
            h_im * r_re * t_im -
            h_im * r_im * t_re,
            dim=-1
        )

        return score

    def loss(
        self,
        positive_triples: torch.Tensor,
        negative_triples: torch.Tensor,
        regularization: float = 0.01
    ) -> torch.Tensor:
        """Binary cross-entropy loss with regularization"""
        pos_scores = self.score(
            positive_triples[:, 0],
            positive_triples[:, 1],
            positive_triples[:, 2]
        )
        neg_scores = self.score(
            negative_triples[:, 0],
            negative_triples[:, 1],
            negative_triples[:, 2]
        )

        # Softplus loss
        pos_loss = F.softplus(-pos_scores).mean()
        neg_loss = F.softplus(neg_scores).mean()

        # L2 regularization
        reg_loss = regularization * (
            self.entity_re.weight.norm(2) +
            self.entity_im.weight.norm(2) +
            self.relation_re.weight.norm(2) +
            self.relation_im.weight.norm(2)
        )

        return pos_loss + neg_loss + reg_loss
```

### RotatE: Rotation in Complex Space

RotatE models relations as rotations in complex space:

$$\mathbf{t} = \mathbf{h} \circ \mathbf{r}$$

where $|\mathbf{r}_i| = 1$ for all dimensions.

```python
class RotatE(nn.Module):
    """RotatE: Knowledge Graph Embedding by Relational Rotation in Complex Space"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 100,
        gamma: float = 12.0  # Margin
    ):
        super().__init__()
        self.num_entities = num_entities
        self.num_relations = num_relations
        self.embedding_dim = embedding_dim
        self.gamma = nn.Parameter(torch.tensor([gamma]), requires_grad=False)
        self.epsilon = 2.0

        # Entity embeddings (real and imaginary parts)
        self.entity_re = nn.Embedding(num_entities, embedding_dim)
        self.entity_im = nn.Embedding(num_entities, embedding_dim)

        # Relation embeddings (phase only, unit norm)
        self.relation_phase = nn.Embedding(num_relations, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        # Initialize entity embeddings
        embedding_range = (self.gamma.item() + self.epsilon) / self.embedding_dim
        nn.init.uniform_(self.entity_re.weight, -embedding_range, embedding_range)
        nn.init.uniform_(self.entity_im.weight, -embedding_range, embedding_range)

        # Initialize relation phases uniformly in [-pi, pi]
        nn.init.uniform_(self.relation_phase.weight, -np.pi, np.pi)

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """
        RotatE scoring: gamma - ||h o r - t||
        where o is element-wise complex multiplication (rotation)
        """
        h_re = self.entity_re(heads)
        h_im = self.entity_im(heads)
        t_re = self.entity_re(tails)
        t_im = self.entity_im(tails)

        # Get rotation angles
        phase = self.relation_phase(relations)
        r_re = torch.cos(phase)
        r_im = torch.sin(phase)

        # Complex multiplication: (h_re + i*h_im) * (r_re + i*r_im)
        rotated_re = h_re * r_re - h_im * r_im
        rotated_im = h_re * r_im + h_im * r_re

        # Distance to tail
        diff_re = rotated_re - t_re
        diff_im = rotated_im - t_im

        # L2 norm of complex difference
        distance = torch.sqrt(diff_re ** 2 + diff_im ** 2 + 1e-12)
        score = self.gamma.item() - torch.sum(distance, dim=-1)

        return score

    def forward(
        self,
        positive_triples: torch.Tensor,
        negative_triples: torch.Tensor
    ) -> torch.Tensor:
        """Self-adversarial negative sampling loss"""
        pos_scores = self.score(
            positive_triples[:, 0],
            positive_triples[:, 1],
            positive_triples[:, 2]
        )
        neg_scores = self.score(
            negative_triples[:, 0],
            negative_triples[:, 1],
            negative_triples[:, 2]
        )

        # Negative log-likelihood
        pos_loss = -F.logsigmoid(pos_scores).mean()
        neg_loss = -F.logsigmoid(-neg_scores).mean()

        return (pos_loss + neg_loss) / 2
```

### DistMult: Bilinear Diagonal Model

DistMult is a simple yet effective bilinear model:

$$f(h, r, t) = \mathbf{h}^T \text{diag}(\mathbf{r}) \mathbf{t} = \sum_i h_i \cdot r_i \cdot t_i$$

```python
class DistMult(nn.Module):
    """DistMult: Embedding Entities and Relations for Learning in Knowledge Bases"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 100
    ):
        super().__init__()
        self.entity_embeddings = nn.Embedding(num_entities, embedding_dim)
        self.relation_embeddings = nn.Embedding(num_relations, embedding_dim)

        nn.init.xavier_uniform_(self.entity_embeddings.weight)
        nn.init.xavier_uniform_(self.relation_embeddings.weight)

    def score(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor
    ) -> torch.Tensor:
        """DistMult scoring: h^T diag(r) t"""
        h = self.entity_embeddings(heads)
        r = self.relation_embeddings(relations)
        t = self.entity_embeddings(tails)

        # Element-wise product
        score = torch.sum(h * r * t, dim=-1)

        return score
```

### Model Comparison Summary

| Model | Type | Symmetric | Antisymmetric | Inverse | Composition |
|-------|------|-----------|---------------|---------|-------------|
| TransE | Translation | No | Yes | Yes | Yes |
| TransR | Translation | No | Yes | Yes | Yes |
| DistMult | Bilinear | Yes | No | No | No |
| ComplEx | Bilinear | Yes | Yes | Yes | No |
| RotatE | Rotation | Yes | Yes | Yes | Yes |
| ConvE | Neural | Yes | Yes | No | No |

---

## Link Prediction

### Problem Definition

Link prediction aims to predict missing facts in knowledge graphs:

- **Head prediction**: Given $(?, r, t)$, predict $h$
- **Tail prediction**: Given $(h, r, ?)$, predict $t$
- **Relation prediction**: Given $(h, ?, t)$, predict $r$

### Evaluation Metrics

```python
from typing import List, Tuple, Dict
import numpy as np

def evaluate_link_prediction(
    model: nn.Module,
    test_triples: np.ndarray,
    all_triples: set,
    num_entities: int,
    batch_size: int = 100
) -> Dict[str, float]:
    """
    Evaluate link prediction performance with filtered setting

    Metrics:
    - MRR: Mean Reciprocal Rank
    - Hits@K: Proportion of correct entities in top K
    """
    model.set_test_mode()

    ranks = []
    hits_at_1 = 0
    hits_at_3 = 0
    hits_at_10 = 0

    with torch.no_grad():
        for i in range(0, len(test_triples), batch_size):
            batch = test_triples[i:i + batch_size]

            for h, r, t in batch:
                # Tail prediction
                tail_scores = []
                for candidate in range(num_entities):
                    score = model.score(
                        torch.LongTensor([h]),
                        torch.LongTensor([r]),
                        torch.LongTensor([candidate])
                    )
                    tail_scores.append((candidate, score.item()))

                # Sort by score (descending for positive scores)
                tail_scores.sort(key=lambda x: -x[1])

                # Filter out other valid triples (filtered setting)
                filtered_rank = 1
                for candidate, score in tail_scores:
                    if candidate == t:
                        break
                    if (h, r, candidate) not in all_triples:
                        filtered_rank += 1

                ranks.append(filtered_rank)

                if filtered_rank == 1:
                    hits_at_1 += 1
                if filtered_rank <= 3:
                    hits_at_3 += 1
                if filtered_rank <= 10:
                    hits_at_10 += 1

    num_test = len(test_triples)

    return {
        "MRR": np.mean([1.0 / r for r in ranks]),
        "MR": np.mean(ranks),
        "Hits@1": hits_at_1 / num_test,
        "Hits@3": hits_at_3 / num_test,
        "Hits@10": hits_at_10 / num_test
    }


# Efficient evaluation with batch scoring
def efficient_link_prediction(
    model: nn.Module,
    test_triples: torch.Tensor,
    all_triples_set: set,
    num_entities: int,
    mode: str = "tail"  # "head" or "tail"
) -> Dict[str, float]:
    """Efficient link prediction with batch scoring"""
    model.set_test_mode()

    ranks = []

    with torch.no_grad():
        for triple in test_triples:
            h, r, t = triple.tolist()

            if mode == "tail":
                # Score all possible tails
                heads = torch.LongTensor([h]).expand(num_entities)
                relations = torch.LongTensor([r]).expand(num_entities)
                tails = torch.arange(num_entities)

                scores = model.score(heads, relations, tails)
                target = t
                filter_mask = [
                    (h, r, e) in all_triples_set and e != t
                    for e in range(num_entities)
                ]
            else:
                # Score all possible heads
                heads = torch.arange(num_entities)
                relations = torch.LongTensor([r]).expand(num_entities)
                tails = torch.LongTensor([t]).expand(num_entities)

                scores = model.score(heads, relations, tails)
                target = h
                filter_mask = [
                    (e, r, t) in all_triples_set and e != h
                    for e in range(num_entities)
                ]

            # Apply filter (set filtered scores to very low value)
            scores[filter_mask] = float('-inf')

            # Get rank
            sorted_indices = torch.argsort(scores, descending=True)
            rank = (sorted_indices == target).nonzero().item() + 1
            ranks.append(rank)

    ranks = np.array(ranks)

    return {
        "MRR": np.mean(1.0 / ranks),
        "MR": np.mean(ranks),
        "Hits@1": np.mean(ranks <= 1),
        "Hits@3": np.mean(ranks <= 3),
        "Hits@10": np.mean(ranks <= 10)
    }
```

### Negative Sampling Strategies

```python
import random
from collections import defaultdict

class NegativeSampler:
    """Various negative sampling strategies for KG embeddings"""

    def __init__(self, triples: np.ndarray, num_entities: int, num_relations: int):
        self.triples = set(map(tuple, triples))
        self.num_entities = num_entities
        self.num_relations = num_relations

        # Build indexes for type-constrained sampling
        self.head_by_relation = defaultdict(set)
        self.tail_by_relation = defaultdict(set)

        for h, r, t in triples:
            self.head_by_relation[r].add(h)
            self.tail_by_relation[r].add(t)

    def uniform_negative(
        self,
        positive: Tuple[int, int, int],
        num_negatives: int = 1
    ) -> List[Tuple[int, int, int]]:
        """Uniform random negative sampling"""
        h, r, t = positive
        negatives = []

        for _ in range(num_negatives):
            while True:
                if random.random() < 0.5:
                    # Corrupt head
                    new_h = random.randint(0, self.num_entities - 1)
                    candidate = (new_h, r, t)
                else:
                    # Corrupt tail
                    new_t = random.randint(0, self.num_entities - 1)
                    candidate = (h, r, new_t)

                if candidate not in self.triples:
                    negatives.append(candidate)
                    break

        return negatives

    def bernoulli_negative(
        self,
        positive: Tuple[int, int, int],
        tph: Dict[int, float],  # tails per head
        hpt: Dict[int, float]   # heads per tail
    ) -> Tuple[int, int, int]:
        """
        Bernoulli negative sampling (Wang et al., 2014)
        Gives different probability to head/tail corruption based on relation type
        """
        h, r, t = positive

        prob_head = tph[r] / (tph[r] + hpt[r])

        while True:
            if random.random() < prob_head:
                new_h = random.randint(0, self.num_entities - 1)
                candidate = (new_h, r, t)
            else:
                new_t = random.randint(0, self.num_entities - 1)
                candidate = (h, r, new_t)

            if candidate not in self.triples:
                return candidate

    def type_constrained_negative(
        self,
        positive: Tuple[int, int, int]
    ) -> Tuple[int, int, int]:
        """Type-constrained negative sampling"""
        h, r, t = positive

        while True:
            if random.random() < 0.5:
                # Sample from valid head types for this relation
                new_h = random.choice(list(self.head_by_relation[r]))
                candidate = (new_h, r, t)
            else:
                # Sample from valid tail types for this relation
                new_t = random.choice(list(self.tail_by_relation[r]))
                candidate = (h, r, new_t)

            if candidate not in self.triples:
                return candidate

    def self_adversarial_negative(
        self,
        model: nn.Module,
        positive: torch.Tensor,
        num_negatives: int = 256,
        temperature: float = 1.0
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Self-adversarial negative sampling (Sun et al., 2019)
        Sample negatives and weight them by model probability
        """
        h, r, t = positive.tolist()

        # Generate negative candidates
        neg_candidates = []
        for _ in range(num_negatives):
            neg = self.uniform_negative((h, r, t), 1)[0]
            neg_candidates.append(neg)

        neg_tensor = torch.LongTensor(neg_candidates)

        # Score negatives
        with torch.no_grad():
            neg_scores = model.score(
                neg_tensor[:, 0],
                neg_tensor[:, 1],
                neg_tensor[:, 2]
            )

        # Compute weights using softmax
        weights = F.softmax(neg_scores * temperature, dim=0)

        return neg_tensor, weights
```

---

## Knowledge Graph Completion

### Task Overview

Knowledge Graph Completion (KGC) extends link prediction to:

1. **Infer missing facts** from existing knowledge
2. **Validate existing triples** for quality assurance
3. **Discover new relationships** through reasoning

### Rule-Based Completion

```python
from itertools import product

class RuleBasedCompletion:
    """Simple rule-based knowledge graph completion"""

    def __init__(self, kg: KnowledgeGraph):
        self.kg = kg

    def transitivity_completion(self, transitive_relations: List[str]) -> List[Triple]:
        """Apply transitivity rule: (a, r, b) & (b, r, c) => (a, r, c)"""
        new_triples = []

        for relation in transitive_relations:
            triples = self.kg.query(relation=relation)

            # Build adjacency
            adjacency = defaultdict(set)
            for triple in triples:
                adjacency[triple.head].add(triple.tail)

            # Find transitive closure
            for a in adjacency:
                visited = set()
                queue = list(adjacency[a])

                while queue:
                    b = queue.pop(0)
                    if b in visited:
                        continue
                    visited.add(b)

                    # Check if (a, r, b) is new
                    if b not in adjacency[a]:
                        new_triple = Triple(a, relation, b)
                        if new_triple not in self.kg.triples:
                            new_triples.append(new_triple)

                    # Continue traversal
                    queue.extend(adjacency.get(b, []))

        return new_triples

    def symmetry_completion(self, symmetric_relations: List[str]) -> List[Triple]:
        """Apply symmetry rule: (a, r, b) => (b, r, a)"""
        new_triples = []

        for relation in symmetric_relations:
            triples = self.kg.query(relation=relation)

            for triple in triples:
                inverse = Triple(triple.tail, relation, triple.head)
                if inverse not in self.kg.triples:
                    new_triples.append(inverse)

        return new_triples

    def inverse_completion(
        self,
        inverse_pairs: List[Tuple[str, str]]
    ) -> List[Triple]:
        """Apply inverse rule: (a, r1, b) => (b, r2, a) where r2 = inverse(r1)"""
        new_triples = []

        for r1, r2 in inverse_pairs:
            triples = self.kg.query(relation=r1)

            for triple in triples:
                inverse = Triple(triple.tail, r2, triple.head)
                if inverse not in self.kg.triples:
                    new_triples.append(inverse)

        return new_triples


# Usage
completer = RuleBasedCompletion(kg)

# Find new triples through transitivity
new_triples = completer.transitivity_completion(["locatedIn", "partOf"])
print(f"Found {len(new_triples)} new triples through transitivity")
```

### Neural Completion with ConvE

```python
class ConvE(nn.Module):
    """ConvE: Convolutional 2D Knowledge Graph Embeddings"""

    def __init__(
        self,
        num_entities: int,
        num_relations: int,
        embedding_dim: int = 200,
        embedding_shape: Tuple[int, int] = (20, 10),  # Reshape to 2D
        num_filters: int = 32,
        kernel_size: int = 3,
        dropout: float = 0.3
    ):
        super().__init__()

        self.embedding_dim = embedding_dim
        self.embedding_shape = embedding_shape

        # Embeddings
        self.entity_embeddings = nn.Embedding(num_entities, embedding_dim)
        self.relation_embeddings = nn.Embedding(num_relations, embedding_dim)

        # Convolutional layers
        self.conv = nn.Conv2d(
            1, num_filters, kernel_size=kernel_size, padding=1
        )
        self.bn0 = nn.BatchNorm2d(1)
        self.bn1 = nn.BatchNorm2d(num_filters)
        self.bn2 = nn.BatchNorm1d(embedding_dim)

        # Dropout
        self.input_dropout = nn.Dropout(dropout)
        self.feature_dropout = nn.Dropout(dropout)
        self.hidden_dropout = nn.Dropout(dropout)

        # Fully connected
        conv_output_size = num_filters * embedding_shape[0] * embedding_shape[1]
        self.fc = nn.Linear(conv_output_size, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        nn.init.xavier_uniform_(self.entity_embeddings.weight)
        nn.init.xavier_uniform_(self.relation_embeddings.weight)

    def forward(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor
    ) -> torch.Tensor:
        """
        Forward pass: compute scores for all possible tails
        """
        batch_size = heads.size(0)

        # Get embeddings
        h = self.entity_embeddings(heads)
        r = self.relation_embeddings(relations)

        # Reshape to 2D
        h = h.view(batch_size, 1, *self.embedding_shape)
        r = r.view(batch_size, 1, *self.embedding_shape)

        # Stack head and relation
        stacked = torch.cat([h, r], dim=2)  # (batch, 1, 2*height, width)

        # Apply convolution
        stacked = self.bn0(stacked)
        stacked = self.input_dropout(stacked)

        x = self.conv(stacked)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.feature_dropout(x)

        # Flatten and project
        x = x.view(batch_size, -1)
        x = self.fc(x)
        x = self.hidden_dropout(x)
        x = self.bn2(x)
        x = F.relu(x)

        # Score against all entities
        scores = torch.mm(x, self.entity_embeddings.weight.transpose(0, 1))

        return scores

    def loss(
        self,
        heads: torch.Tensor,
        relations: torch.Tensor,
        tails: torch.Tensor,
        label_smoothing: float = 0.1
    ) -> torch.Tensor:
        """Binary cross-entropy loss with label smoothing"""
        scores = self.forward(heads, relations)

        # Create target with label smoothing
        targets = torch.zeros_like(scores)
        targets.scatter_(1, tails.unsqueeze(1), 1.0)
        targets = (1 - label_smoothing) * targets + label_smoothing / scores.size(1)

        # BCE loss
        loss = F.binary_cross_entropy_with_logits(scores, targets)

        return loss
```

---

## Knowledge Graph Question Answering

### KGQA Overview

Knowledge Graph Question Answering (KGQA) aims to answer natural language questions using structured knowledge graphs.

**Pipeline:**
1. **Question Understanding**: Parse and understand the question
2. **Entity Linking**: Map mentions to KG entities
3. **Query Generation**: Generate structured query (SPARQL) or reasoning path
4. **Answer Retrieval**: Execute query and retrieve answers

### Embedding-Based KGQA

```python
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

class EmbeddingKGQA(nn.Module):
    """
    Embedding-based Knowledge Graph Question Answering
    Uses pre-trained language model for question encoding
    """

    def __init__(
        self,
        kg_embedding_model: nn.Module,
        num_entities: int,
        hidden_dim: int = 768,
        pretrained_model: str = "bert-base-uncased"
    ):
        super().__init__()

        # Question encoder (BERT)
        self.tokenizer = AutoTokenizer.from_pretrained(pretrained_model)
        self.question_encoder = AutoModel.from_pretrained(pretrained_model)

        # KG embeddings (frozen)
        self.kg_model = kg_embedding_model
        for param in self.kg_model.parameters():
            param.requires_grad = False

        # Projection layers
        kg_dim = kg_embedding_model.embedding_dim
        self.question_projection = nn.Linear(hidden_dim, kg_dim)
        self.relation_classifier = nn.Linear(hidden_dim, kg_embedding_model.num_relations)

        self.num_entities = num_entities

    def encode_question(self, questions: List[str]) -> torch.Tensor:
        """Encode questions using BERT"""
        inputs = self.tokenizer(
            questions,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="pt"
        )

        outputs = self.question_encoder(**inputs)

        # Use [CLS] token representation
        return outputs.last_hidden_state[:, 0, :]

    def forward(
        self,
        questions: List[str],
        topic_entities: torch.Tensor
    ) -> torch.Tensor:
        """
        Answer questions by finding tail entities

        Args:
            questions: List of natural language questions
            topic_entities: Entity IDs mentioned in questions

        Returns:
            Scores for all entities as potential answers
        """
        batch_size = len(questions)

        # Encode questions
        q_encoded = self.encode_question(questions)

        # Project to KG embedding space
        q_projected = self.question_projection(q_encoded)

        # Predict relation
        relation_logits = self.relation_classifier(q_encoded)
        relation_probs = F.softmax(relation_logits, dim=-1)

        # Get topic entity embeddings
        h = self.kg_model.entity_embeddings(topic_entities)

        # Weighted combination of relations
        all_relations = torch.arange(self.kg_model.num_relations)
        r_embeddings = self.kg_model.relation_embeddings(all_relations)

        # Expected relation embedding
        r = torch.mm(relation_probs, r_embeddings)

        # Predict tail using TransE-like scoring
        predicted_tail = h + r

        # Score against all entities
        all_entities = self.kg_model.entity_embeddings.weight
        scores = -torch.cdist(predicted_tail, all_entities)

        return scores


class MultiHopKGQA(nn.Module):
    """Multi-hop reasoning over knowledge graphs for complex questions"""

    def __init__(
        self,
        kg_embedding_model: nn.Module,
        num_hops: int = 2,
        hidden_dim: int = 768
    ):
        super().__init__()

        self.kg_model = kg_embedding_model
        self.num_hops = num_hops

        kg_dim = kg_embedding_model.embedding_dim

        # Hop-specific relation predictors
        self.hop_predictors = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_dim + kg_dim, hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, kg_embedding_model.num_relations)
            )
            for _ in range(num_hops)
        ])

        # Question encoder
        self.question_encoder = AutoModel.from_pretrained("bert-base-uncased")
        self.tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

    def forward(
        self,
        questions: List[str],
        topic_entities: torch.Tensor,
        adjacency: Dict[Tuple[int, int], Set[int]]
    ) -> torch.Tensor:
        """
        Multi-hop reasoning to answer complex questions

        Returns:
            Answer entity scores
        """
        # Encode question
        inputs = self.tokenizer(questions, return_tensors="pt", padding=True)
        q_encoded = self.question_encoder(**inputs).last_hidden_state[:, 0, :]

        batch_size = len(questions)
        current_entities = topic_entities

        for hop in range(self.num_hops):
            # Get current entity embeddings
            e_current = self.kg_model.entity_embeddings(current_entities)

            # Predict relation for this hop
            combined = torch.cat([q_encoded, e_current], dim=-1)
            relation_logits = self.hop_predictors[hop](combined)
            predicted_relation = torch.argmax(relation_logits, dim=-1)

            # Follow the predicted relation (simplified)
            next_entities = []
            for i, (e, r) in enumerate(zip(current_entities.tolist(), predicted_relation.tolist())):
                neighbors = adjacency.get((e, r), set())
                if neighbors:
                    next_entities.append(list(neighbors)[0])  # Take first neighbor
                else:
                    next_entities.append(e)  # Stay if no neighbor

            current_entities = torch.LongTensor(next_entities)

        # Score final entities
        final_embeddings = self.kg_model.entity_embeddings(current_entities)
        scores = torch.mm(final_embeddings, self.kg_model.entity_embeddings.weight.t())

        return scores
```

### SPARQL Generation

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer

class Text2SPARQL:
    """Convert natural language questions to SPARQL queries"""

    def __init__(self, model_name: str = "t5-base"):
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)

    def generate_sparql(self, question: str, max_length: int = 256) -> str:
        """Generate SPARQL query from natural language question"""
        input_text = f"translate to SPARQL: {question}"

        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            max_length=128,
            truncation=True
        )

        outputs = self.model.generate(
            inputs.input_ids,
            max_length=max_length,
            num_beams=5,
            early_stopping=True
        )

        sparql = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return sparql


# Template-based SPARQL generation
class TemplateSPARQL:
    """Template-based SPARQL generation for common question patterns"""

    TEMPLATES = {
        "who_is": """
            SELECT ?answer WHERE {{
                wd:{entity} wdt:{relation} ?answer .
            }}
        """,
        "what_is": """
            SELECT ?answer WHERE {{
                wd:{entity} wdt:P31 ?answer .
            }}
        """,
        "where_is": """
            SELECT ?answer WHERE {{
                wd:{entity} wdt:P131 ?answer .
            }}
        """,
        "when_was": """
            SELECT ?answer WHERE {{
                wd:{entity} wdt:{date_property} ?answer .
            }}
        """,
        "count": """
            SELECT (COUNT(?item) AS ?count) WHERE {{
                ?item wdt:{relation} wd:{entity} .
            }}
        """
    }

    def __init__(self, entity_linker=None, relation_mapper=None):
        self.entity_linker = entity_linker
        self.relation_mapper = relation_mapper

    def generate(
        self,
        question: str,
        question_type: str,
        entity: str,
        relation: str = None
    ) -> str:
        """Generate SPARQL from template"""
        template = self.TEMPLATES.get(question_type)
        if not template:
            raise ValueError(f"Unknown question type: {question_type}")

        return template.format(entity=entity, relation=relation or "")
```

---

## Practical Applications

### Application 1: Recommendation System

```python
class KGRecommender:
    """Knowledge Graph-based Recommendation System"""

    def __init__(
        self,
        kg_model: nn.Module,
        user_item_graph: KnowledgeGraph,
        item_attribute_graph: KnowledgeGraph
    ):
        self.kg_model = kg_model
        self.user_item_graph = user_item_graph
        self.item_attribute_graph = item_attribute_graph

    def get_user_embedding(self, user_id: int) -> torch.Tensor:
        """Get user embedding from interaction history"""
        # Get items user has interacted with
        interactions = self.user_item_graph.query(head=f"user_{user_id}")

        if not interactions:
            return torch.zeros(self.kg_model.embedding_dim)

        # Average item embeddings
        item_ids = [int(t.tail.split("_")[1]) for t in interactions]
        item_embeddings = self.kg_model.entity_embeddings(torch.LongTensor(item_ids))

        return item_embeddings.mean(dim=0)

    def recommend(
        self,
        user_id: int,
        num_recommendations: int = 10,
        exclude_seen: bool = True
    ) -> List[Tuple[int, float]]:
        """Generate recommendations for a user"""
        user_embedding = self.get_user_embedding(user_id)

        # Score all items
        all_items = self.kg_model.entity_embeddings.weight
        scores = torch.mv(all_items, user_embedding)

        # Exclude already seen items
        if exclude_seen:
            seen = self.user_item_graph.query(head=f"user_{user_id}")
            seen_ids = [int(t.tail.split("_")[1]) for t in seen]
            scores[seen_ids] = float('-inf')

        # Get top-k
        top_scores, top_indices = torch.topk(scores, num_recommendations)

        return list(zip(top_indices.tolist(), top_scores.tolist()))

    def explain_recommendation(
        self,
        user_id: int,
        item_id: int
    ) -> List[str]:
        """Generate explanation for a recommendation"""
        explanations = []

        # Find common attributes with liked items
        user_items = self.user_item_graph.query(head=f"user_{user_id}")
        liked_item_ids = [int(t.tail.split("_")[1]) for t in user_items]

        # Get item attributes
        item_attrs = self.item_attribute_graph.query(head=f"item_{item_id}")

        for attr_triple in item_attrs:
            attr = attr_triple.tail

            # Check if this attribute is shared with liked items
            for liked_id in liked_item_ids:
                liked_attrs = self.item_attribute_graph.query(
                    head=f"item_{liked_id}"
                )
                if any(t.tail == attr for t in liked_attrs):
                    explanations.append(
                        f"Similar to item {liked_id} which you liked "
                        f"(both have {attr_triple.relation}: {attr})"
                    )
                    break

        return explanations[:3]  # Return top 3 explanations
```

### Application 2: Drug Discovery

```python
class DrugKnowledgeGraph:
    """Knowledge Graph for Drug Discovery"""

    def __init__(self, kg_model: nn.Module):
        self.kg_model = kg_model

        # Relation types for drug discovery
        self.relation_types = {
            "treats": 0,
            "causes": 1,
            "interacts_with": 2,
            "targets": 3,
            "associated_with": 4
        }

    def predict_drug_targets(
        self,
        drug_id: int,
        num_predictions: int = 10
    ) -> List[Tuple[int, float]]:
        """Predict potential targets for a drug"""
        drug_embedding = self.kg_model.entity_embeddings(
            torch.LongTensor([drug_id])
        )
        target_relation = self.kg_model.relation_embeddings(
            torch.LongTensor([self.relation_types["targets"]])
        )

        # TransE-style prediction
        predicted_target = drug_embedding + target_relation

        # Score against all proteins (targets)
        all_entities = self.kg_model.entity_embeddings.weight
        scores = -torch.cdist(predicted_target, all_entities).squeeze()

        top_scores, top_indices = torch.topk(scores, num_predictions)
        return list(zip(top_indices.tolist(), top_scores.tolist()))

    def predict_drug_disease_associations(
        self,
        drug_id: int,
        num_predictions: int = 10
    ) -> List[Tuple[int, float]]:
        """Predict diseases a drug might treat"""
        drug_embedding = self.kg_model.entity_embeddings(
            torch.LongTensor([drug_id])
        )
        treats_relation = self.kg_model.relation_embeddings(
            torch.LongTensor([self.relation_types["treats"]])
        )

        predicted_disease = drug_embedding + treats_relation

        all_entities = self.kg_model.entity_embeddings.weight
        scores = -torch.cdist(predicted_disease, all_entities).squeeze()

        top_scores, top_indices = torch.topk(scores, num_predictions)
        return list(zip(top_indices.tolist(), top_scores.tolist()))

    def predict_drug_interactions(
        self,
        drug_id: int,
        num_predictions: int = 10
    ) -> List[Tuple[int, float]]:
        """Predict potential drug-drug interactions"""
        drug_embedding = self.kg_model.entity_embeddings(
            torch.LongTensor([drug_id])
        )
        interaction_relation = self.kg_model.relation_embeddings(
            torch.LongTensor([self.relation_types["interacts_with"]])
        )

        predicted_interaction = drug_embedding + interaction_relation

        all_entities = self.kg_model.entity_embeddings.weight
        scores = -torch.cdist(predicted_interaction, all_entities).squeeze()

        top_scores, top_indices = torch.topk(scores, num_predictions)
        return list(zip(top_indices.tolist(), top_scores.tolist()))
```

### Application 3: Enterprise Knowledge Management

```python
class EnterpriseKG:
    """Enterprise Knowledge Graph for organizational knowledge management"""

    def __init__(self):
        self.kg = KnowledgeGraph()
        self.entity_types = {}
        self.embeddings = None

    def ingest_employee_data(self, employees: List[dict]) -> None:
        """Ingest employee data into knowledge graph"""
        for emp in employees:
            emp_id = f"employee_{emp['id']}"
            self.entity_types[emp_id] = "Employee"

            # Add employee attributes
            self.kg.add_triple(emp_id, "hasName", emp["name"])
            self.kg.add_triple(emp_id, "hasRole", emp["role"])
            self.kg.add_triple(emp_id, "worksIn", f"department_{emp['department']}")

            # Add skills
            for skill in emp.get("skills", []):
                self.kg.add_triple(emp_id, "hasSkill", f"skill_{skill}")

            # Add projects
            for project in emp.get("projects", []):
                self.kg.add_triple(emp_id, "worksOn", f"project_{project}")

            # Add reporting structure
            if emp.get("manager_id"):
                self.kg.add_triple(
                    emp_id, "reportsTo", f"employee_{emp['manager_id']}"
                )

    def ingest_project_data(self, projects: List[dict]) -> None:
        """Ingest project data"""
        for proj in projects:
            proj_id = f"project_{proj['id']}"
            self.entity_types[proj_id] = "Project"

            self.kg.add_triple(proj_id, "hasName", proj["name"])
            self.kg.add_triple(proj_id, "belongsTo", f"department_{proj['department']}")

            for tech in proj.get("technologies", []):
                self.kg.add_triple(proj_id, "uses", f"technology_{tech}")

    def find_experts(self, skill: str, limit: int = 5) -> List[str]:
        """Find employees with a specific skill"""
        triples = self.kg.query(relation="hasSkill", tail=f"skill_{skill}")
        return [t.head for t in triples][:limit]

    def find_collaboration_path(
        self,
        employee1: str,
        employee2: str
    ) -> List[str]:
        """Find collaboration path between two employees"""
        from collections import deque

        # BFS to find shortest path through projects
        queue = deque([(employee1, [employee1])])
        visited = {employee1}

        while queue:
            current, path = queue.popleft()

            if current == employee2:
                return path

            # Find projects
            projects = self.kg.query(head=current, relation="worksOn")

            for proj_triple in projects:
                project = proj_triple.tail

                # Find coworkers
                coworkers = self.kg.query(relation="worksOn", tail=project)

                for cw_triple in coworkers:
                    coworker = cw_triple.head
                    if coworker not in visited:
                        visited.add(coworker)
                        queue.append((coworker, path + [project, coworker]))

        return []  # No path found

    def analyze_skill_gaps(self, project: str) -> List[str]:
        """Analyze skill gaps for a project"""
        # Get required technologies
        tech_triples = self.kg.query(head=project, relation="uses")
        required_tech = {t.tail for t in tech_triples}

        # Get team members
        member_triples = self.kg.query(relation="worksOn", tail=project)

        # Get team skills
        team_skills = set()
        for member_triple in member_triples:
            skill_triples = self.kg.query(head=member_triple.head, relation="hasSkill")
            team_skills.update(t.tail for t in skill_triples)

        # Find gaps (technologies without matching skills)
        # This is a simplified matching
        gaps = []
        for tech in required_tech:
            tech_name = tech.replace("technology_", "skill_")
            if tech_name not in team_skills:
                gaps.append(tech)

        return gaps
```

---

## Interview Essentials

### Core Concept Questions

**Q1: What is a Knowledge Graph and how does it differ from a relational database?**

A Knowledge Graph is a graph-structured database that represents knowledge as entities (nodes) and relationships (edges). Key differences from relational databases:

| Aspect | Knowledge Graph | Relational Database |
|--------|----------------|---------------------|
| Structure | Graph (nodes + edges) | Tables (rows + columns) |
| Schema | Flexible, can evolve | Fixed schema |
| Relationships | First-class citizens | Foreign keys |
| Queries | Graph traversal, SPARQL | SQL |
| Use cases | Semantic reasoning | Transactional processing |

**Q2: Explain the TransE model and its scoring function.**

TransE interprets relations as translations in embedding space. For a valid triple (h, r, t):
- The scoring function is: $f(h, r, t) = -\|\mathbf{h} + \mathbf{r} - \mathbf{t}\|$
- A lower score indicates a more plausible triple
- Limitation: Cannot model symmetric relations (husband/wife) or 1-N relations

**Q3: What are the differences between TransE, ComplEx, and RotatE?**

```
TransE:
- Translation: h + r = t
- Simple and efficient
- Cannot model symmetric relations

ComplEx:
- Complex embeddings
- Scoring: Re(<h, r, conj(t)>)
- Can model symmetric and antisymmetric relations

RotatE:
- Rotation in complex space: t = h o r
- Can model symmetry, antisymmetry, inversion, and composition
- State-of-the-art performance
```

**Q4: How do you assess link prediction models?**

Key metrics:
- **MRR (Mean Reciprocal Rank)**: Average of reciprocal ranks
- **Hits@K**: Proportion of correct entities in top K
- **MR (Mean Rank)**: Average rank of correct entities

Important: Use **filtered setting** to exclude other valid triples when ranking.

### Advanced Questions

**Q5: How would you handle a very large knowledge graph that doesn't fit in memory?**

Strategies:
1. **Distributed training**: Use parameter servers or distributed embeddings
2. **Mini-batch negative sampling**: Sample negatives efficiently
3. **Graph partitioning**: Partition graph across machines
4. **Hierarchical embeddings**: Use type hierarchies for efficient lookup
5. **Approximation**: Use locality-sensitive hashing for nearest neighbor search

**Q6: Explain the difference between transductive and inductive link prediction.**

```python
# Transductive: Entities seen during training
# Can directly use learned embeddings

# Inductive: New entities at test time
# Need to compute embeddings from features

class InductiveKGE(nn.Module):
    def __init__(self, feature_encoder, relation_dim):
        self.feature_encoder = feature_encoder
        self.relation_embeddings = nn.Embedding(num_relations, relation_dim)

    def get_entity_embedding(self, entity_features):
        # Compute embedding from features for new entities
        return self.feature_encoder(entity_features)
```

**Q7: How do you incorporate temporal information in knowledge graphs?**

Approaches:
1. **Time-aware embeddings**: Add time encoding to triples (h, r, t, timestamp)
2. **Temporal scoring**: $f(h, r, t, \tau) = g(h, r, t) + \text{time\_score}(\tau)$
3. **Snapshot models**: Train separate embeddings for different time periods
4. **Continuous time**: Model time as continuous variable with decay functions

**Q8: What is the role of negative sampling in KGE training?**

Negative sampling is crucial because:
1. We only have positive examples (valid triples)
2. Open-world assumption: Missing triples are not necessarily false
3. Negative samples provide contrastive signal

Strategies:
- Uniform random sampling
- Bernoulli sampling (relation-specific)
- Self-adversarial sampling (weighted by model probability)
- Type-constrained sampling

### Practical Questions

**Q9: How would you build a Knowledge Graph from unstructured text?**

```
Pipeline:
1. Named Entity Recognition (NER)
   - Identify entity mentions

2. Entity Linking
   - Map mentions to KG entities

3. Relation Extraction
   - Extract relationships between entities

4. Knowledge Graph Population
   - Add extracted triples to KG

5. Quality Assurance
   - Confidence scoring
   - Human validation for uncertain triples
```

**Q10: What are the challenges in deploying Knowledge Graphs at scale?**

Challenges and solutions:

| Challenge | Solution |
|-----------|----------|
| Scale | Distributed storage, sharding |
| Freshness | Incremental updates, streaming ingestion |
| Quality | Automated validation, crowd-sourcing |
| Query performance | Indexing, caching, query optimization |
| Integration | APIs, ontology alignment |

---

## Further Reading

### Classic Papers

1. **TransE** (2013): "Translating Embeddings for Modeling Multi-relational Data"
2. **ComplEx** (2016): "Complex Embeddings for Simple Link Prediction"
3. **RotatE** (2019): "RotatE: Knowledge Graph Embedding by Relational Rotation in Complex Space"
4. **ConvE** (2018): "Convolutional 2D Knowledge Graph Embeddings"
5. **R-GCN** (2018): "Modeling Relational Data with Graph Convolutional Networks"

### Benchmark Datasets

| Dataset | Entities | Relations | Triples | Domain |
|---------|----------|-----------|---------|--------|
| FB15k-237 | 14,541 | 237 | 310K | General |
| WN18RR | 40,943 | 11 | 93K | Lexical |
| YAGO3-10 | 123,182 | 37 | 1.1M | General |
| NELL-995 | 75,492 | 200 | 154K | Web |
| Wikidata5M | 4.6M | 822 | 21M | General |

### Libraries and Tools

- **PyKEEN**: Python package for knowledge graph embeddings
- **DGL-KE**: Deep Graph Library for KG embeddings
- **AmpliGraph**: TensorFlow library for KG embeddings
- **OpenKE**: Open-source knowledge embedding toolkit
- **LibKGE**: Library for knowledge graph embeddings

### Online Resources

- [Knowledge Graph Conference (KGC)](https://www.knowledgegraph.tech/)
- [Stanford CS520: Knowledge Graphs](https://web.stanford.edu/class/cs520/)
- [Wikidata Query Service](https://query.wikidata.org/)
- [Google Knowledge Graph API](https://developers.google.com/knowledge-graph)

---

## Summary

Knowledge Graphs represent a powerful paradigm for organizing and reasoning over structured knowledge. Key takeaways:

1. **Representation**: Triples (h, r, t) form the fundamental unit of knowledge
2. **Embeddings**: Transform discrete symbols into continuous vectors for machine learning
3. **Models**: Translation-based (TransE, TransR) and semantic matching (ComplEx, RotatE)
4. **Tasks**: Link prediction, knowledge graph completion, question answering
5. **Applications**: Search, recommendations, drug discovery, enterprise knowledge

The field continues to evolve with:
- Integration with large language models
- Multimodal knowledge graphs
- Temporal and dynamic knowledge graphs
- Federated and privacy-preserving approaches

Mastering knowledge graphs requires understanding both the theoretical foundations and practical implementation details. Regular practice with real datasets and tools will solidify your expertise.
