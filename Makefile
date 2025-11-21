.PHONY: validate validate-policy validate-providers

validate: validate-policy validate-providers

validate-policy:
	node scripts/validate-configs.mjs --file policy.yaml --schema .nexxon/schemas/policy.schema.json

validate-providers:
	node scripts/validate-configs.mjs --file providers.yaml --schema .nexxon/schemas/providers.schema.json

