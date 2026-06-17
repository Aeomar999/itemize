# Itemize - Automated IMDB Extraction 📦✨

Itemize is a modern, responsive Web Application and Progressive Web App (PWA) designed to automate the extraction of item master data (IMDB attributes) from product images and videos. Using advanced Gemini AI Vision models, it analyzes media of physical products and instantly extracts fields like Barcode, Manufacturer, Brand, Weight, Packaging Type, and more. 

## 🚀 Features
- **AI-Powered Extraction**: Upload images and videos of physical products and let Gemini AI automatically categorize and identify product specifications.
- **Multi-Angle Support**: Add multiple images and videos to a single product record to improve the accuracy of extraction. 
- **PWA Ready**: Install the app on your mobile device for a native-like experience, complete with an app icon, offline caching, and a "Pull-to-Refresh" feature.
- **Supabase Integration**: Persistent cloud storage and database synchronization. Your data is never lost.
- **Excel Exports**: Advanced, beautifully formatted `.xlsx` and `.csv` exports for enterprise data ingestion.
- **Mobile First**: Take photos or record videos directly from your phone's camera right within the app.

---

## 💻 Desktop Application Guide

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Supabase Project
- Google Gemini API Key

### Installation

1. **Clone or Download the repository.**
2. **Install dependencies:**
   ```bash
   cd itemize
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env.local` file in the root of the `itemize` directory and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Setup Supabase Database:**
   Copy the contents of `setup.sql` into your Supabase project's **SQL Editor** and run it to create the necessary tables and storage buckets.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📱 Mobile PWA Installation Guide

Itemize is built as a Progressive Web App (PWA), meaning you can install it directly onto your smartphone's home screen for a seamless, app-like experience without going through the App Store or Google Play.

### iOS (Safari)
1. Open the application URL in **Safari**.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name "Itemize" and tap **Add**.
5. The Itemize app icon will now appear on your home screen!

### Android (Chrome)
1. Open the application URL in **Google Chrome**.
2. Tap the **Menu** button (three dots in the top right corner).
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Follow the prompt to install.
5. The Itemize app icon will be added to your app drawer and home screen!

*(Note: In the PWA, pull down from the very top of the dashboard screen to trigger the custom pull-to-refresh data sync!)*

---

## 📸 Media Gallery

### Desktop View
![Desktop Dashboard]()
![Desktop Capture 1]()
![Desktop Capture 2]()
![Desktop Capture 3]()
![Desktop Capture 4]()

**Desktop Walkthrough Video:**
<video width="100%" controls>
  <source src="../Screeshots/Desktop%20view/Recording%202026-06-17%20122730.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

### Mobile View (PWA)
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="../Screeshots/Mobile%20view/WhatsApp%20Image%202026-06-17%20at%2012.28.25%20PM.jpeg" width="30%" alt="Mobile Capture 1">
  <img src="../Screeshots/Mobile%20view/WhatsApp%20Image%202026-06-17%20at%2012.28.25%20PM%20(1).jpeg" width="30%" alt="Mobile Capture 2">
  <img src="../Screeshots/Mobile%20view/WhatsApp%20Image%202026-06-17%20at%2012.28.25%20PM%20(2).jpeg" width="30%" alt="Mobile Capture 3">
</div>

**Mobile Walkthrough Video:**
<video width="100%" controls>
  <source src="../Screeshots/Mobile%20view/WhatsApp%20Video%202026-06-17%20at%2012.29.21%20PM.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

## 🛠️ How to Use Itemize

1. **Upload Product Media:**
   - On Desktop: Drag and drop product images or short videos into the upload zone, or click to browse files.
   - On Mobile: Tap "Photo" to launch your camera, "Video" to record a video, or "Browse" to select existing media.
2. **AI Extraction:**
   - Once media is selected, Itemize will upload it to Supabase Storage and securely process it through Google's Gemini Vision AI.
   - You will see a "processing" indicator while the AI works to identify all IMDB attributes.
3. **Review & Edit:**
   - Processed items will appear in the dashboard grid. Click on any item to open its **Product Details Page**.
   - Here, you can review the AI's confidence scores for each extracted field.
   - Click on any attribute (like Brand, Weight, or Variant) to manually edit it if the AI made a mistake.
   - You can also upload *more* angles (extra photos or videos) from the details page. The AI will immediately re-analyze the product using the combined context of all uploaded media!
4. **Export:**
   - Return to the main dashboard and click **"Export Data"**.
   - Choose Excel (`.xlsx`) or `.csv`.
   - The Excel file is richly formatted with optimized column widths, frozen headers, and alternating row colors for easy reading in enterprise systems.
