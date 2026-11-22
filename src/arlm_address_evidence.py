"""Provider-qualified candidate addresses and symmetric feature eligibility."""

from arlm_contact import FIELDS
from arlm_interpretation import resolve_address
from arlm_state import encode, sha

PUBLIC_FIELDS = FIELDS[:7]


def public_address(address):
    return {field: address[field] for field in PUBLIC_FIELDS}


def resolve_records(rows, positions):
    """Execute the same POP operation for every candidate position."""
    cache = {}
    records = {}
    for row in rows:
        ref = row["ref"]
        position = positions[ref]
        key = encode(position)
        if key not in cache:
            cache[key] = resolve_address(position)
        resolved = cache[key]
        records[ref] = [{
            "provider": resolved["mapping"]["provider"],
            "mappingSha256": sha(encode(resolved["mapping"])),
            "verificationSha256": sha(encode(resolved["receipt"])),
            "fields": dict(resolved["address"]),
        }]
    return records


def validate_record(record):
    from arlm_inference import digest, fields, strings

    fields(record, "provider mappingSha256 verificationSha256 fields")
    strings(record["provider"])
    if not all(digest(record[key]) for key in ("mappingSha256", "verificationSha256")):
        raise ValueError("Invalid provider mapping or verification digest")
    fields(record["fields"], " ".join(FIELDS))
    for field, value in record["fields"].items():
        if value is None:
            continue
        if type(value) is int and value >= 0:
            continue
        if isinstance(value, str) and value.strip() and field in ("planetary", "dimension", "zodiac"):
            continue
        raise ValueError(f"Invalid address value in {field}")


def eligible_addresses(candidates, records, mappings):
    """Only use provider/fields with complete, unambiguous pool coverage."""
    from arlm_inference import fields

    by_ref = {row["ref"] for candidate in candidates for row in candidate["evidence"]}
    if set(records) - by_ref:
        raise ValueError("Address record outside candidate evidence")
    for entries in records.values():
        if not isinstance(entries, list) or not entries:
            raise ValueError("Each address reference requires provider records")
        seen = set()
        for record in entries:
            validate_record(record)
            provider = record["provider"]
            if provider in seen:
                raise ValueError("Duplicate provider for address reference")
            seen.add(provider)
            if provider in mappings and record["mappingSha256"] != mappings[provider]["mappingSha256"]:
                raise ValueError("Provider mapping fingerprint changed")
    matched = {}
    for provider, policy in sorted(mappings.items()):
        fields(policy, "mappingSha256 fields")
        allowed = policy["fields"]
        if (not isinstance(allowed, list) or any(field not in PUBLIC_FIELDS for field in allowed)
                or len(set(allowed)) != len(allowed)):
            raise ValueError("Invalid provider field policy")
        for field in FIELDS:
            if field not in allowed:
                continue
            values = {}
            for candidate in candidates:
                refs = [row["ref"] for row in candidate["evidence"] if row["ref"] in records]
                relevant = [record for ref in refs for record in records[ref] if record["provider"] == provider]
                observed = {rec["fields"][field] for rec in relevant}
                if len(observed) != 1 or None in observed:
                    break
                values[candidate["id"]] = observed.pop()
            if values and len(values) == len(candidates):
                matched[(provider, field)] = values
    consistent = {}
    for field in PUBLIC_FIELDS:
        interpretations = [values for (_, key), values in matched.items() if key == field]
        if interpretations and all(values == interpretations[0] for values in interpretations):
            consistent[field] = interpretations[0]
    return {candidate["id"]: [
        {"field": field, "value": values[candidate["id"]]}
        for field, values in consistent.items()
    ] for candidate in candidates}


def address_contract(candidates, records, mappings, mode):
    if mode not in ("private-comparable", "omitted-for-all"):
        raise ValueError("Unknown address feature policy")
    matched = eligible_addresses(candidates, records, mappings)
    return matched if mode == "private-comparable" else {key: [] for key in matched}
