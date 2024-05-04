const env = {
	GLOBAL_HOST: process.env.GLOBAL_HOST,
	SPACE_NAME: process.env.SPACE_NAME,
	HUB_ADDRESS: process.env.HUB_ADDRESS,
	FAUCET_ADDRESS: process.env.FAUCET_ADDRESS,
	OWNER_ID: process.env.OWNER_ID,
	HUB_MNEMONIC: process.env.HUB_MNEMONIC,
	FAUCET_MNEMONIC: process.env.FAUCET_MNEMONIC,
	TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
	TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
	LOCALLY_TESTING: 'true' === process.env.LOCALLY_TESTING,
	ANYONE_CAN_JOIN: 'true' === process.env.ANYONE_CAN_JOIN,
	ANYONE_CAN_ADD: 'true' === process.env.ANYONE_CAN_ADD,
};

export default env;
