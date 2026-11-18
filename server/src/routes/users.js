import express from 'express';

const router = express.Router();

export const SEEDED_USERS = [
  {
    id: 'user-mahesh',
    name: 'Mahesh Dhangar',
    email: 'mahesh@ajaia.ai',
    role: 'Lead Engineer',
    avatar: 'MD',
  },
  {
    id: 'user-alex',
    name: 'Alex Chen',
    email: 'alex@ajaia.ai',
    role: 'Product Designer',
    avatar: 'AC',
  },
  {
    id: 'user-priya',
    name: 'Priya Patel',
    email: 'priya@ajaia.ai',
    role: 'Engineering Manager',
    avatar: 'PP',
  },
];

router.get('/', (req, res) => {
  res.json({ users: SEEDED_USERS });
});

export default router;
