import json
from datetime import datetime, timezone
from pathlib import Path


CONTRACT = Path(__file__).parents[2] / "contracts" / "dispute_dock.py"
BASE_TIME = 2_000_000_000


def iso(timestamp: int) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def address(value) -> str:
    return "0x" + bytes(value).hex()


def test_deploy_and_create_agreement(direct_vm, direct_deploy, direct_accounts):
    client, worker = direct_accounts[:2]
    direct_vm.warp(iso(BASE_TIME))
    direct_vm.sender = client
    dock = direct_deploy(str(CONTRACT))
    dock.create_agreement(
        "dock-smoke-001",
        "Five-page wallet website",
        "Build a responsive five-page website with a working wallet connection.",
        address(worker),
        "https://evidence.example/terms.md",
        "a" * 64,
        "Responsive design|2000\nFive pages|2000\nWallet integration|2000\nDeadline|4000",
        5 * 10**18,
        BASE_TIME + 3600,
        BASE_TIME + 86_400,
        3600,
        3600,
        3600,
    )
    agreement = json.loads(dock.get_agreement("dock-smoke-001"))
    assert agreement["status"] == "AWAITING_ACCEPTANCE"
    assert agreement["client"].lower() == address(client).lower()
    assert agreement["worker"].lower() == address(worker).lower()
    assert len(agreement["agreement_hash"]) == 64
