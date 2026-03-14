"""Pytest configuration for backend tests."""
import pytest


def pytest_configure(config):
    config.addinivalue_line("markers", "e2e: end-to-end tests against live API (skip by default)")


def pytest_collection_modifyitems(config, items):
    """Skip E2E tests unless explicitly requested with -m e2e."""
    if config.getoption("-m", default="") != "e2e":
        skip_e2e = pytest.mark.skip(reason="E2E tests require -m e2e flag")
        for item in items:
            if "e2e" in item.keywords:
                item.add_marker(skip_e2e)
