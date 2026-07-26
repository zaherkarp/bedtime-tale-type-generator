"""A provenance-first folklore knowledge base.

Built to the architecture in ``docs/atu-kb-assessment.md``. The three-way
distinction the assessment calls the correct spine is physical here: ``raw``
holds source facts exactly as retrieved and is immutable, ``core`` holds
normalised records that always carry their source, and ``publish`` holds a
license-filtered projection that is rebuilt and swapped atomically.
"""

__version__ = "0.1.0"
