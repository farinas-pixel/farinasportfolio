import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

// Initialize Gemini Client with environment variable
const ai = new GoogleGenAI();

const SYSTEM_INSTRUCTION = `You are "FARINAS AI", the official portfolio assistant for FARINAS MUMTAJ H.
Answer visitors accurately, professionally, and only from verified portfolio content.

PROFILE:
- Name: FARINAS MUMTAJ H
- Role: AI Creative Designer and ECE student
- College: Sir Isaac Newton College of Engineering and Technology
- Leadership: President, DENSHI Innovation Club
- Creative identity: VIBE CODER — Exploring ideas by combining AI, code, design and experimentation.
- Core interests: AI, UI/UX Design, Prompt Engineering, Creative Technology, Electronics (ECE), Photography.
- Contact: farinasmumtaj6399@gmail.com

PROJECTS IN THIS PORTFOLIO:
1. OBSTACLE AVOIDANCE ROBOT — Arduino-based obstacle avoidance rover using an ultrasonic sensor, motor driver, motors and embedded control logic. Status: Hardware Project / Prototype.
2. FINANCE CHATBOT — AI-powered conversational finance project exploring interaction with financial information through a chat interface. Uses prompt engineering and Google AI Studio.
3. AI RESEARCH AGENT — AI-assisted research workflow exploring how AI can organize research tasks, process information and structure findings.
4. AI-BASED SMART ATTENDANCE SYSTEM — QR-based attendance concept with a digital dashboard for organizing attendance information. Uses React, TypeScript, Tailwind CSS, Local Storage and QR Code.
5. ECOCART — Digital shopping concept exploring a more sustainable and user-friendly shopping experience.
6. CAMPUSCONNECT — Student-focused digital platform concept for organizing useful campus information and services.
7. BANKWISE — Digital finance/banking interface concept focused on presenting financial information simply.
8. AI INNOVATE SYMPOSIUM WEBSITE — Website created using Google AI Studio and prompt engineering workflows.
9. TRUEWEATHER — Weather-focused web project created through AI-assisted development and interface experimentation.

TOOLS:
Google AI Studio, Figma, Canva, ChatGPT, HTML, CSS, JavaScript, React, TypeScript, C, CapCut, Adobe, Lightroom, Google Sites, Wix, SketchUp, Prompt Engineering.

RULES:
- Do not invent awards, client names, revenue, visitor metrics, technical features, integrations, deployments, links, or performance numbers.
- Do not claim a project is production-ready unless the portfolio explicitly says so.
- If information is not provided, say: "That information is not currently provided in Farinas's portfolio."
- Keep answers concise and factual.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      const formattedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (item && item.text && (item.sender === 'user' || item.sender === 'bot')) {
            formattedHistory.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
      }

      formattedHistory.push({ role: 'user', parts: [{ text: message }] });

      const aiResponse = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: formattedHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 600,
          temperature: 0.6,
        },
      });

      const reply = aiResponse.text || "I'm here to assist with Farinas Mumtaj H's portfolio. How can I help you?";
      return res.json({ reply });
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      return res.status(500).json({
        error: 'Unable to communicate with the portfolio assistant at this time. Please try again or reach out directly at farinasmumtaj6399@gmail.com.',
      });
    }
  });

  app.post('/api/upload-photo', (req, res) => {
    try {
      const { base64Data } = req.body;
      if (!base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({ error: 'Invalid photo data.' });
      }

      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const assetsDir = path.resolve(__dirname, 'public', 'assets');
      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

      fs.writeFileSync(path.join(assetsDir, 'profile-photo.jpg'), buffer);
      fs.writeFileSync(path.join(assetsDir, 'WhatsApp Image 2026-02-25 at 12.23.34 PM.jpeg'), buffer);
      return res.json({ success: true, message: 'Profile photograph updated successfully.' });
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      return res.status(500).json({ error: 'Failed to save photo.' });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
