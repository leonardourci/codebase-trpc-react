import { createUser, getUserByEmail, getUserById } from '../../../src/database/repositories/user.repository';
import { cleanTestData, seedFreeTierProduct } from '../../setup/test-db';
import bcrypt from 'bcrypt';

describe('User Repository', () => {
    beforeEach(async () => {
        await cleanTestData();
        await seedFreeTierProduct();
    });

    it('should create and retrieve a user', async () => {
        const passwordHash = await bcrypt.hash('testpassword', 10);

        const userData = {
            email: 'test@example.com',
            fullName: 'Test User',
            age: 25,
            phone: '1234567890',
            passwordHash
        };

        // Create user using repository
        const createdUser = await createUser(userData);

        expect(createdUser).toMatchObject({
            email: userData.email,
            fullName: userData.fullName,
            age: userData.age,
            phone: userData.phone
        });
        expect(createdUser.id).toBeDefined();

        // Retrieve user by email (returns limited info for auth)
        const userByEmail = await getUserByEmail({ email: userData.email });
        expect(userByEmail).not.toBeNull();
        expect(userByEmail?.id).toBe(createdUser.id);
        expect(userByEmail?.passwordHash).toBeDefined();

        // Retrieve user by ID (returns full user info)
        const userById = await getUserById({ id: createdUser.id });
        expect(userById).not.toBeNull();
        expect(userById?.id).toBe(createdUser.id);
        expect(userById?.email).toBe(userData.email);
        expect(userById?.fullName).toBe(userData.fullName);
    });

    it('should return null for non-existent user', async () => {
        const user = await getUserByEmail({ email: 'nonexistent@example.com' });
        expect(user).toBeNull();
    });
});