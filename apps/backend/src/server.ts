import dotenv from 'dotenv';
import app from './app';
import cors from 'cors'; // Added this line

dotenv.config();

const PORT = process.env.PORT || 3001;

if (require.main === module) {
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }));
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;

// Trigger restart
