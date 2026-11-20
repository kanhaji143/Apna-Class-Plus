# AppX (Bharat AI Research Centre) बनाम Apna Class Plus — Comparison Notes

> तारीख: 20 नवंबर 2026 | लाइव: https://apna-class-plus.web.app
> स्रोत: `Bharat AI Research Centre.apk` (53.7 MB, 5,050 entries, package `com.lvgqik.duvriw`) + `Bharat_AI_Research_Centre_Report_Hinglish.pdf` (AppX Core white-label EdTech, backend `bharatairesearchcentreapi.akamai.net.in`)

---

## 1. क्या-क्या Common है (दोनों में)

| Feature | AppX | Apna Class Plus |
|---|---|---|
| Courses + categories + details | ✅ | ✅ |
| Course content (videos/PDFs/folders) | ✅ | ✅ (कोर्स + फ्री मटेरियल) |
| Mock tests / quiz / test series | ✅ | ✅ (+ comprehension) |
| Study notes / PDF | ✅ | ✅ (फ्री मटेरियल) |
| Doubt / teacher chat | ✅ | ✅ (चैट) |
| Coupons / discounts | ✅ | ✅ |
| Payments (Razorpay) | ✅ | ✅ (Test Mode) |
| Store / cart | ✅ | ✅ (पब्लिक स्टोर) |
| Batches | ✅ | ✅ |
| Free material / free tests | ✅ | ✅ |
| Leaderboard / rank | ✅ | ❌ → **free extras में जोड़ा गया** |

## 2. हमारे खास Features — जो AppX में नहीं हैं (हमारी ताकत)

| # | Feature | AppX |
|---|---|---|
| 1 | **लैंडिंग पेज बिल्डर** — 4 टेम्पलेट + सेक्शन एडिटर + पब्लिश (`/lp-preview/:slug`) | ❌ (स्टूडेंट ऐप; कोई लैंडिंग बिल्डर नहीं) |
| 2 | **लीड कैप्चर + CRM** — लैंडिंग/स्टोर लीड → People → Convert → Student | ❌ (स्टूडेंट लॉगिन-आधारित) |
| 3 | **लॉगिन-रहित स्टूडेंट एक्सेस** — `/learn/:token`, `/chat/:token` (capability links) | ❌ (OTP लॉगिन अनिवार्य) |
| 4 | **टीचर वेब डैशबोर्ड + कंटेंट मैनेजर** — सब कुछ एक जगह | आंशिक (अलग admin portal) |
| 5 | **कैंपेन** — ऑडियंस-बेस्ड मैसेजिंग (All/Leads/Course/Batch) | ❌ (रिपोर्ट में नहीं) |
| 6 | **कॉम्प्रिहेंशन प्रश्न प्रकार** + बल्क इम्पोर्ट (docx पेस्ट) | ❌ |
| 7 | **प्रोग्रेस ट्रैकिंग + टीचर प्रोग्रेस डैशबोर्ड** (%, प्रति-लिंक) | ❌ (सिर्फ़ watch-time) |
| 8 | **फ़ोन-आधारित बैच/स्टूडेंट मैनेजमेंट** (बिना स्टूडेंट लॉगिन) | ❌ (रजिस्टर्ड यूज़र) |
| 9 | **कूपन एप्लाई फ़्लो** (कोड → कीमत घटे) | आंशिक |
| 10 | **द्विभाषी प्लेयर** (English default + हिंदी fallback) | आंशिक |
| 11 | **मोबाइल-रिस्पॉन्सिव वेब ऐप** | ❌ (Android APK) |
| 12 | **रोल + ट्रायल** (superadmin/admin/teacher) | ❌ (व्हाइट-लेबल प्रति इंस्टीट्यूट) |
| 13 | **सीड डेमो डेटा** (एक क्लिक) | ❌ |

## 3. AppX के Extra Features (हमारे में नहीं)

### A. फ्री / आसान (इस सत्र में जोड़े गए)
| # | Feature | Status |
|---|---|---|
| 1 | **लीडरबोर्ड / रैंक / टॉप स्कोरर** | ✅ जोड़ा गया |
| 2 | **ग्लोबल सर्च** (कोर्स/टेस्ट/मटेरियल) | ✅ जोड़ा गया |
| 3 | **फैकल्टी/टीचर प्रोफ़ाइल** | ✅ जोड़ा गया |
| 4 | **एग्ज़ाम-वाइज़ नोट्स** (कैटेगरी: Current Affairs/JEE/NEET/SSC) | ✅ जोड़ा गया |
| 5 | **लेसन रेटिंग** (Learn पेज पर स्टार) | ✅ जोड़ा गया |
| 6 | **डेली क्विज़ हाइलाइट** | ✅ जोड़ा गया |
| 7 | **BMI/बॉडी फैट कैलकुलेटर** (टूल) | ✅ जोड़ा गया |
| 8 | ब्लॉग/शॉर्ट्स/फ़ीड | ⏳ योजना |
| 9 | सर्वे / काउंसलिंग पेज | ⏳ योजना |
| 10 | पुश नोटिफिकेशन (FCM) | ⏳ योजना |
| 11 | टेस्ट पास / सब्सक्रिप्शन | ⏳ योजना |
| 12 | रेफ़रल कोड | ⏳ योजना |

### B. पैसा/Infra चाहिए (महंगे)
- लाइव क्लासेस + Zoom integration
- वीडियो DRM (PallyCon/Widevine) + स्क्रीन-रिकॉर्ड ब्लॉक
- एन्क्रिप्टेड PDF + डायनामिक वॉटरमार्क
- OMR शीट स्कैनिंग
- Doubtnut AI (फोटो से समाधान)
- EMI/BNPL (BharatX/Simpl)
- UPI QR + Cashfree, Play billing, एफिलिएट पेआउट

## 4. फ्री Features (AppX में free)
फ्री कोर्स, फ्री टेस्ट सीरीज़, फ्री क्लासेस, डेमो कोर्स, नोट्स, करंट अफेयर्स, यूट्यूब क्लासेस, फ्री मटेरियल — इनमें से काफी हम पहले से देते हैं; बाकी जो फ्री जोड़े गए: डेली क्विज़, करंट अफेयर्स कैटेगरी, लीडरबोर्ड।

## 5. अगले कदम
- फ्री एक्स्ट्रा → पहले लीडरबोर्ड, सर्च, फैकल्टी, कैटेगरी, रेटिंग, डेली क्विज़, BMI टूल
- फिर पेड आइडियाज़ (लाइव क्लास, DRM, EMI, OMR, Doubtnut)
