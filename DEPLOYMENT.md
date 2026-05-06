# Deployment Guide (Free Tier)

This guide will walk you through deploying the entire Satellite-8 project for free using Vercel (for the frontend) and Render (for the backend services). 

The project has been modified to support seamless deployments by using environment variables.

---

## 1. Deploying the Backend Services (Python & Java) to Render

Render offers a great free tier for running both web services and Docker containers. 
We have created a `render.yaml` file to make deployment a breeze.

### Steps:
1. Go to [Render](https://render.com/) and sign up or log in.
2. Go to your Render Dashboard and click **"New"** -> **"Blueprint"**.
3. Connect your GitHub account and select this repository.
4. Render will automatically detect the `render.yaml` file at the root of the repository.
5. Apply the blueprint. This will automatically start spinning up **two** services:
   - `satellite-python-service`: The Python ML/COG Service.
   - `satellite-java-backend`: The Java Spring Boot Service.
6. **Important**: Since we are using Render's free tier, the first build will take some time (Java compilation can take ~5-8 mins on the free tier). 
7. Once both services say **"Live"**, click on your `satellite-java-backend` service and copy its public URL (e.g., `https://satellite-java-backend-xxxx.onrender.com`). You will need this for the frontend!

*(Note: Render free services sleep after 15 minutes of inactivity. When you visit your frontend after a period of inactivity, the first API request might take 1-2 minutes while the backend wakes up).*

---

## 2. Deploying the Frontend (React/Vite) to Vercel

Vercel is incredibly fast and free for frontend projects.

### Steps:
1. Go to [Vercel](https://vercel.com/) and sign up or log in.
2. From your Vercel Dashboard, click **"Add New"** -> **"Project"**.
3. Connect your GitHub account and import this repository.
4. In the "Configure Project" screen, ensure the Framework Preset is set to **Vite**.
5. **CRITICAL STEP - Set Environment Variables**:
   Open the "Environment Variables" dropdown and add the following keys:
   
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://satellite-java-backend-xxxx.onrender.com/api` *(Replace with your actual Java Backend URL from Render. Don't forget the `/api` at the end!)*

   - **Name**: `VITE_PYTHON_API_URL`
   - **Value**: `https://satellite-python-service-xxxx.onrender.com` *(Replace with your actual Python Service URL from Render)*

6. Click **Deploy**. Vercel will build and publish your frontend within a minute.
7. Once deployed, click **"Continue to Dashboard"** and copy your frontend's public Vercel URL (e.g., `https://satllite-8-main-xyz.vercel.app`).

---

## 3. Final Step: Allowing CORS

For security, the Java Backend needs to know your Frontend URL so it can accept requests from it.

### Steps:
1. Go back to your [Render Dashboard](https://dashboard.render.com/).
2. Select your `satellite-java-backend` service.
3. Go to **"Environment"** on the left menu.
4. Add a new Environment Variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: The Vercel URL you just copied (e.g., `https://satllite-8-main-xyz.vercel.app`) - *No trailing slash at the end!*
5. Click **"Save Changes"**. Render will restart your Java backend automatically.

---

## 🎉 You're Done!

You can now visit your Vercel URL to view your fully deployed Satellite-8 project. All connections between the Frontend, the Java Backend, and the Python ML service will happen securely in the cloud!
