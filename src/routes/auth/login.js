import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const blacklist = []; // JWT 블랙리스트를 메모리에 저장
const prisma = new PrismaClient();

/* 로그인 (auth/login) */
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    console.log(email, password);

    try {
        // 필수 입력 필드 확인
        if (!email || !password) {
            return res.status(400).json({
                errorCode: 100,
                errorMessage: "Bad Request Exception",
                description: "Email and password are required"
            });
        }

        // 사용자 찾기
        const user = await prisma.users.findUnique({
            where: { email },
        });
        console.log(`user : ${user}`)

        if (!user) {
            return res.status(401).json({
                errorCode: 101,
                errorMessage: "Unauthorized Exception",
                description: "Invalid email or password"
            });
        }

        // JWT 생성
        const token = jwt.sign(
            { id: user.id, email: user.email }, process.env.JWT_SECRET,
            { expiresIn: process.env.TOKEN_EXPIRATION }
        );

        // 비밀번호 검증 (테스트시 주석처리)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid && password !== user.password) {
            return res.status(401).json({
                errorCode: 101,
                errorMessage: "Unauthorized Exception",
                description: "Invalid email or password"
            });
        }

        // 로그인 성공
        res.status(200).json({
            message: 'Login successful',
            user: user,
            token: token
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({
            errorCode: 900,
            errorMessage: "Unexpected Error",
            description: "Failed to login user"
        });
    }
});

/* 로그아웃 (auth/logout) */
router.post("/logout", (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        blacklist.push(token);

        res.status(200).json({
            message: "Logout successful"
        });
    } catch (error) {
        res.status(500).json({
            errorCode: 900,
            errorMessage: "Unexpected Error",
            description: "Failed to log out"
        });
    }
});

export default router;