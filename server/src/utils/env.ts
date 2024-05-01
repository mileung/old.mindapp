const env = {
	hostname: process.env.HOSTNAME,
	spaceName: process.env.SPACE_NAME,
	hubAddress: process.env.HUB_ADDRESS,
	faucetAddress: process.env.FAUCET_ADDRESS,
	ownerId: process.env.OWNER_ID,
	hubMnemonic: process.env.HUB_MNEMONIC,
	faucetMnemonic: process.env.FAUCET_MNEMONIC,
	tursoDatabaseUrl: process.env.TURSO_DATABASE_URL,
	tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
	locallyTesting: process.env.LOCALLY_TESTING === 'true',
	isGlobalSpace: process.env.IS_GLOBAL_SPACE === 'true',
	anyoneCanJoin: process.env.ANYONE_CAN_JOIN === 'true',
	anyoneCanAdd: process.env.ANYONE_CAN_ADD === 'true',
};

export default env;
