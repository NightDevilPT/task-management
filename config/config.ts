export const config = {
	databaseUrl: process.env.MONGODB_URI,
	jwtSecret: process.env.NEXT_JWT_SECRET, // Assuming you intended `NEXT_JWT_SECRET`
	jwtExpireIn: process.env.JWT_EXPIREIN,
	jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
	origin: process.env.ORIGIN,
	emailId: process.env.EMAIL_ID,
	emailPassword: process.env.EMAIL_PASSWORD,
};
