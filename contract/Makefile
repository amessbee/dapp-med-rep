CHAINID=agoriclocal
USERNAME ?= user1

ADDR := $(shell kubectl exec -i agoriclocal-genesis-0 -c validator -- sh -c '\
    if ! agd keys show $(USERNAME) >/dev/null 2>&1; then \
        agd keys add $(USERNAME) --output json; \
    else \
        agd keys show $(USERNAME) --output json; \
    fi' | jq -r ".address" \
)

$(info USERNAME is $(USERNAME))
$(info ADDR is $(ADDR))

PROVISION_POOL_ADDR=agoric1megzytg65cyrgzs6fvzxgrcqvwwl7ugpt62346
CLIENTADDR=agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk
CLIENT_OSMO_ADDR=osmo1rhvgsqq96n3qyv3u0zlwleyaunpmal6uhnam4z

DEPLOY_SCRIPT=npx --no-install tsx ./scripts/deploy-cli.ts

# Required for fund target
fund-provision-pool:
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx bank send faucet $(PROVISION_POOL_ADDR) 1000000000uist -y -b block;
	sleep 2;

check-balance:
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd q bank balances $(ADDR)

fund-wallet:
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx bank send faucet $(ADDR) 10000000000000uist -y -b block
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx bank send faucet $(ADDR) 10000000000000ubld -y -b block

provision-smart-wallet:
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx swingset provision-one wallet $(ADDR) SMART_WALLET --from ${ADDR} -y -b block

fund-osmo:
	kubectl exec -i osmosislocal-genesis-0 -c validator -- osmosisd tx bank send faucet ${CLIENT_OSMO_ADDR} 9870000000uosmo --fees 1000uosmo -y;

# Main targets
fund: fund-provision-pool
	make fund-wallet;
	make provision-smart-wallet;
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx bank send faucet ${CLIENTADDR} 10000000000000ubld -y;
	sleep 2;
	kubectl exec -i agoriclocal-genesis-0 -c validator -- agd tx bank send faucet ${CLIENTADDR} 10000000000000uist -y;
	make fund-osmo

deploy: fund
	$(DEPLOY_SCRIPT) scripts/init-ed-cert.js

