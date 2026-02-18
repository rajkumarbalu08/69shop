(function(global){
  const productsData = [
    // ============ MOBILES ============
    {
      id: 'm1',
      name: 'OnePlus 12R 5G',
      category: 'mobiles',
      price: 38999,
      originalPrice: 45999,
      rating: 4.7,
      seller: 'OnePlus Store',
      image: 'https://m.media-amazon.com/images/I/61amb0CfMGL._SL1500_.jpg',
      description: 'Snapdragon 8 Gen 2, 120Hz AMOLED, 100W SuperVOOC, 5500mAh Battery',
      tags: ['5g', 'flagship', 'gaming', 'fast charging', 'amoled', 'premium', 'oneplus', 'android', 'smartphone', 'phone'],
      brand: 'OnePlus',
      stock: 50,
      specs: {
        general: {
          model: 'OnePlus 12R',
          color: 'Iron Gray, Cool Blue',
          weight: '207g',
          dimensions: '163.3 x 75.3 x 8.8 mm',
          warranty: '1 Year Manufacturer Warranty'
        },
        technical: {
          display: '6.78" LTPO AMOLED, 120Hz, 1264 x 2780 pixels, 450 ppi',
          processor: 'Qualcomm Snapdragon 8 Gen 2 (4nm)',
          ram: '8GB / 16GB LPDDR5X',
          storage: '128GB / 256GB UFS 4.0',
          battery: '5500mAh Li-Po, 100W SuperVOOC wired, 80W SUPERVOOC wireless',
          connectivity: '5G, WiFi 7, Bluetooth 5.4, NFC, USB Type-C 2.0',
          os: 'OxygenOS 14 based on Android 14'
        },
        camera: {
          rear: '50MP (Sony IMX890) + 8MP Ultrawide + 2MP Macro',
          front: '16MP Sony IMX471',
          video: '4K@60fps, 8K@24fps, Dolby Vision HDR',
          features: 'OIS, EIS, Nightscape, Pro Mode, 4K Nightscape Video'
        },
        features: ['Snapdragon 8 Gen 2', '100W Fast Charging', '120Hz LTPO AMOLED', 'Dolby Vision', 'Alert Slider', 'Dual Stereo Speakers']
      }
    },
    {
      id: 'm2',
      name: 'OnePlus Nord CE4',
      category: 'mobiles',
      price: 24999,
      originalPrice: 27999,
      rating: 4.5,
      seller: 'Prime Mobile Hub',
      image: 'https://m.media-amazon.com/images/I/61QRgOgBx0L._SL1500_.jpg',
      description: 'Snapdragon 7 Gen 3, 120Hz AMOLED, 100W SUPERVOOC, 5500mAh',
      tags: ['5g', 'budget', 'mid-range', 'fast charging', 'amoled', 'oneplus', 'android', 'smartphone', 'phone', 'under 25000'],
      brand: 'OnePlus',
      stock: 75,
      specs: {
        general: {
          model: 'OnePlus Nord CE4',
          color: 'Dark Chrome, Celadon Marble',
          weight: '184g',
          dimensions: '162.6 x 75.6 x 7.99 mm',
          warranty: '1 Year Manufacturer Warranty'
        },
        technical: {
          display: '6.7" AMOLED, 120Hz, 1080 x 2412 pixels, 394 ppi',
          processor: 'Qualcomm Snapdragon 7 Gen 3 (4nm)',
          ram: '8GB LPDDR4X',
          storage: '128GB / 256GB UFS 3.1',
          battery: '5500mAh Li-Po, 100W SUPERVOOC wired',
          connectivity: '5G, WiFi 6, Bluetooth 5.3, NFC, USB Type-C 2.0',
          os: 'OxygenOS 14 based on Android 14'
        },
        camera: {
          rear: '50MP Sony LYT-600 (OIS) + 8MP Ultrawide',
          front: '16MP',
          video: '4K@30fps, 1080p@60fps',
          features: 'OIS, EIS, Night Mode, Portrait Mode'
        },
        features: ['100W SUPERVOOC Charging', '5500mAh Battery', '120Hz AMOLED', 'Aqua Touch', 'AI Eraser']
      }
    },
    {
      id: 'm3',
      name: 'Samsung Galaxy S23 FE',
      category: 'mobiles',
      price: 49999,
      originalPrice: 59999,
      rating: 4.6,
      seller: 'Samsung Exclusive',
      image: 'https://m.media-amazon.com/images/I/71lD7eGdW-L._SL1500_.jpg',
      description: 'Flagship camera, IP68, wireless charging, Exynos 2200',
      tags: ['5g', 'flagship', 'camera phone', 'waterproof', 'wireless charging', 'premium', 'samsung', 'android', 'smartphone', 'phone'],
      brand: 'Samsung',
      stock: 35,
      specs: {
        general: {
          model: 'Galaxy S23 FE',
          color: 'Mint, Cream, Graphite, Purple',
          weight: '209g',
          dimensions: '158 x 76.5 x 8.2 mm',
          warranty: '1 Year Samsung India Warranty'
        },
        technical: {
          display: '6.4" Dynamic AMOLED 2X, 120Hz, 1080 x 2340 pixels, 403 ppi',
          processor: 'Samsung Exynos 2200 (4nm)',
          ram: '8GB LPDDR5',
          storage: '128GB / 256GB',
          battery: '4500mAh Li-Ion, 25W wired, 15W wireless, Reverse wireless',
          connectivity: '5G, WiFi 6E, Bluetooth 5.3, NFC, USB Type-C 3.2',
          os: 'One UI 6 based on Android 14'
        },
        camera: {
          rear: '50MP (OIS) + 12MP Ultrawide + 8MP Telephoto (3x)',
          front: '10MP',
          video: '8K@24fps, 4K@60fps',
          features: 'OIS, 3x Optical Zoom, Night Mode, Single Take, Object Eraser'
        },
        features: ['IP68 Water Resistant', 'Wireless Charging', '8K Video', '3x Optical Zoom', 'Gorilla Glass Victus+']
      }
    },
    {
      id: 'm4',
      name: 'iPhone 15',
      category: 'mobiles',
      price: 79999,
      originalPrice: 84999,
      rating: 4.8,
      seller: 'Apple Authorised',
      image: 'https://m.media-amazon.com/images/I/71d7rfSl0wL._SL1500_.jpg',
      description: 'A16 Bionic, Dynamic Island, USB-C, 48MP Camera',
      tags: ['5g', 'flagship', 'ios', 'premium', 'camera phone', 'apple', 'iphone', 'smartphone', 'phone', 'usb-c'],
      brand: 'Apple',
      stock: 25,
      specs: {
        general: {
          model: 'iPhone 15',
          color: 'Black, Blue, Green, Yellow, Pink',
          weight: '171g',
          dimensions: '147.6 x 71.6 x 7.8 mm',
          warranty: '1 Year Apple India Warranty'
        },
        technical: {
          display: '6.1" Super Retina XDR OLED, 60Hz, 1179 x 2556 pixels, 460 ppi',
          processor: 'Apple A16 Bionic (4nm)',
          ram: '6GB',
          storage: '128GB / 256GB / 512GB',
          battery: '3349mAh, 20W wired, 15W MagSafe wireless, 7.5W Qi',
          connectivity: '5G, WiFi 6, Bluetooth 5.3, NFC, USB Type-C 2.0, Ultra Wideband',
          os: 'iOS 17'
        },
        camera: {
          rear: '48MP Main (OIS) + 12MP Ultrawide',
          front: '12MP TrueDepth',
          video: '4K@60fps Dolby Vision HDR, Cinematic Mode 4K@30fps',
          features: 'Photonic Engine, Smart HDR 5, Portrait Mode, Night Mode'
        },
        features: ['Dynamic Island', 'USB-C Port', 'Ceramic Shield Front', 'A16 Bionic Chip', 'Crash Detection', 'Emergency SOS via Satellite']
      }
    },
    {
      id: 'm5',
      name: 'Redmi Note 13 Pro',
      category: 'mobiles',
      price: 18999,
      originalPrice: 22999,
      rating: 4.4,
      seller: 'Mi Preferred',
      image: 'https://m.media-amazon.com/images/I/51JoybX0SLL._SL1080_.jpg',
      description: '200MP OIS camera, AMOLED 120Hz, 67W Turbo Charge',
      tags: ['5g', 'budget', 'camera phone', '200mp', 'amoled', 'fast charging', 'xiaomi', 'redmi', 'android', 'smartphone', 'phone', 'under 20000'],
      brand: 'Xiaomi',
      stock: 100,
      specs: {
        general: {
          model: 'Redmi Note 13 Pro',
          color: 'Midnight Black, Lavender Purple, Coral Purple',
          weight: '187g',
          dimensions: '161.2 x 74.2 x 7.98 mm',
          warranty: '1 Year Mi India Warranty'
        },
        technical: {
          display: '6.67" AMOLED, 120Hz, 1080 x 2400 pixels, 395 ppi',
          processor: 'Qualcomm Snapdragon 7s Gen 2 (4nm)',
          ram: '8GB / 12GB LPDDR4X',
          storage: '128GB / 256GB UFS 2.2 (expandable)',
          battery: '5100mAh Li-Po, 67W Turbo Charge',
          connectivity: '5G, WiFi 6, Bluetooth 5.2, NFC, USB Type-C 2.0',
          os: 'MIUI 14 based on Android 13'
        },
        camera: {
          rear: '200MP Samsung ISOCELL HP3 (OIS) + 8MP Ultrawide + 2MP Macro',
          front: '16MP',
          video: '4K@30fps, 1080p@60fps',
          features: 'OIS, 200MP Ultra Clarity Mode, Night Mode, Pro Mode'
        },
        features: ['200MP Camera', '67W Fast Charging', 'IP54 Rating', 'Corning Gorilla Glass Victus', '120Hz AMOLED']
      }
    },
    {
      id: 'm6',
      name: 'Realme 12 Pro+',
      category: 'mobiles',
      price: 32999,
      originalPrice: 36999,
      rating: 4.5,
      seller: 'Realme Official',
      image: 'https://m.media-amazon.com/images/I/71FtSGf6BoL._SL1500_.jpg',
      description: 'Sony IMX890, Periscope 3x Zoom, 67W SUPERVOOC',
      tags: ['5g', 'mid-range', 'camera phone', 'zoom', 'curved display', 'fast charging', 'realme', 'android', 'smartphone', 'phone'],
      brand: 'Realme',
      stock: 45,
      specs: {
        general: {
          model: 'Realme 12 Pro+',
          color: 'Navigator Beige, Submarine Blue',
          weight: '190g',
          dimensions: '161.5 x 73.9 x 8.8 mm',
          warranty: '1 Year Realme India Warranty'
        },
        technical: {
          display: '6.7" Curved AMOLED, 120Hz, 1080 x 2412 pixels, 394 ppi',
          processor: 'Qualcomm Snapdragon 7s Gen 2 (4nm)',
          ram: '8GB / 12GB LPDDR4X',
          storage: '256GB / 512GB UFS 3.1',
          battery: '5000mAh Li-Po, 67W SUPERVOOC',
          connectivity: '5G, WiFi 6, Bluetooth 5.2, NFC, USB Type-C 2.0',
          os: 'Realme UI 5.0 based on Android 14'
        },
        camera: {
          rear: '50MP Sony IMX890 (OIS) + 8MP Ultrawide + 64MP Periscope Telephoto (3x)',
          front: '32MP Sony IMX615',
          video: '4K@30fps, 1080p@60fps',
          features: 'OIS, 3x Optical Zoom, 120x Zoom, Pro Mode, Street Photography 2.0'
        },
        features: ['Periscope 3x Optical Zoom', 'Luxury Watch Design', 'Curved Display', '67W Fast Charging', 'Sony IMX890 Sensor']
      }
    },
    {
      id: 'm7',
      name: 'Pixel 8a',
      category: 'mobiles',
      price: 45999,
      originalPrice: 52999,
      rating: 4.6,
      seller: 'Google Store',
      image: 'https://m.media-amazon.com/images/I/71JFxjbDmvL._SL1500_.jpg',
      description: 'Google Tensor G3, Pixel AI, OLED 120Hz, 7 years updates',
      tags: ['5g', 'ai', 'camera phone', 'stock android', 'google', 'pixel', 'android', 'smartphone', 'phone', 'clean ui'],
      brand: 'Google',
      stock: 30,
      specs: {
        general: {
          model: 'Pixel 8a',
          color: 'Obsidian, Porcelain, Bay, Aloe',
          weight: '188g',
          dimensions: '152.1 x 72.7 x 8.9 mm',
          warranty: '2 Year Google Warranty'
        },
        technical: {
          display: '6.1" OLED, 120Hz, 1080 x 2400 pixels, 430 ppi',
          processor: 'Google Tensor G3 (4nm)',
          ram: '8GB LPDDR5',
          storage: '128GB / 256GB UFS 3.1',
          battery: '4492mAh Li-Ion, 18W wired, 7.5W Qi wireless',
          connectivity: '5G, WiFi 6E, Bluetooth 5.3, NFC, USB Type-C 3.2',
          os: 'Android 14 (Stock), 7 years of updates'
        },
        camera: {
          rear: '64MP (OIS) + 13MP Ultrawide',
          front: '13MP',
          video: '4K@60fps, 1080p@240fps slow-mo',
          features: 'Magic Eraser, Best Take, Photo Unblur, Audio Magic Eraser, Night Sight'
        },
        features: ['7 Years of Updates', 'Pixel AI Features', 'Magic Eraser', 'Real Tone', 'Call Screening', 'Live Translate']
      }
    },

    // ============ HEADPHONES ============
    {
      id: 'h1',
      name: 'Sony WH-1000XM5',
      category: 'headphones',
      price: 29999,
      originalPrice: 34990,
      rating: 4.8,
      seller: 'Sony Center',
      image: 'https://m.media-amazon.com/images/I/61vJtKbAssL._SL1500_.jpg',
      description: 'Industry-leading ANC, 30hr battery, LDAC, Multipoint',
      tags: ['wireless', 'bluetooth', 'anc', 'noise cancelling', 'premium', 'over-ear', 'headphones', 'sony', 'hi-res', 'audiophile', 'work from home'],
      brand: 'Sony',
      stock: 40,
      specs: {
        general: {
          model: 'WH-1000XM5',
          color: 'Black, Silver, Midnight Blue',
          weight: '250g',
          dimensions: '228 x 195 x 39 mm (folded)',
          warranty: '1 Year Sony India Warranty'
        },
        audio: {
          driver: '30mm Dome Drivers',
          frequency: '4Hz - 40kHz',
          anc: 'Yes - Auto NC Optimizer, 8 microphones',
          codec: 'SBC, AAC, LDAC',
          battery: 'Up to 30 hours with ANC, 3 min charge = 3 hours'
        },
        technical: {
          connectivity: 'Bluetooth 5.2, 3.5mm jack, USB-C',
          processor: 'Integrated Processor V1 + QN1',
          battery: '30 hours (ANC on), 40 hours (ANC off)',
          charging: 'USB-C, 3 min quick charge = 3 hours'
        },
        features: ['Industry-leading ANC', '30 Hour Battery', 'Speak-to-Chat', 'Multipoint Connection', 'LDAC Hi-Res Audio', 'Adaptive Sound Control']
      }
    },
    {
      id: 'h2',
      name: 'Bose QuietComfort Ultra',
      category: 'headphones',
      price: 34999,
      originalPrice: 39900,
      rating: 4.7,
      seller: 'Bose India',
      image: 'https://m.media-amazon.com/images/I/51QeS7PJGXL._SL1500_.jpg',
      description: 'Immersive spatial audio, World-class ANC, 24hr battery',
      tags: ['wireless', 'bluetooth', 'anc', 'noise cancelling', 'premium', 'over-ear', 'headphones', 'bose', 'spatial audio'],
      brand: 'Bose',
      stock: 25,
      specs: {
        general: {
          model: 'QuietComfort Ultra Headphones',
          color: 'Black, White Smoke, Sandstone',
          weight: '254g',
          dimensions: '195 x 139 x 51 mm',
          warranty: '1 Year Bose India Warranty'
        },
        audio: {
          driver: 'Bose Proprietary Transducers',
          frequency: 'Not Specified by Bose',
          anc: 'Yes - World-class Quiet Mode, Aware Mode',
          codec: 'SBC, AAC, aptX Adaptive',
          battery: 'Up to 24 hours'
        },
        technical: {
          connectivity: 'Bluetooth 5.3, 2.5mm/3.5mm audio cable, USB-C',
          processor: 'Bose Spatial Audio Engine',
          battery: '24 hours with ANC, 2.5 hr fast charge = 2 hours',
          charging: 'USB-C'
        },
        features: ['Bose Immersive Audio', 'CustomTune Sound', 'World-class Noise Cancellation', 'Multipoint', 'Aware Mode', 'Adjustable EQ']
      }
    },
    {
      id: 'h3',
      name: 'AirPods Pro (2nd Gen)',
      category: 'headphones',
      price: 24999,
      originalPrice: 26900,
      rating: 4.6,
      seller: 'Apple Authorised',
      image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg',
      description: 'H2 chip, Active Noise Cancellation, MagSafe USB-C Case',
      tags: ['wireless', 'bluetooth', 'anc', 'noise cancelling', 'tws', 'earbuds', 'apple', 'airpods', 'iphone accessories'],
      brand: 'Apple',
      stock: 60,
      specs: {
        general: {
          model: 'AirPods Pro (2nd Generation)',
          color: 'White',
          weight: '5.3g each, Case: 50.8g',
          dimensions: 'Earbuds: 30.9 x 21.8 x 24mm',
          warranty: '1 Year Apple India Warranty'
        },
        audio: {
          driver: 'Apple-designed H2 chip driver',
          frequency: 'Not specified',
          anc: 'Yes - 2x more Active Noise Cancellation than Gen 1',
          codec: 'AAC, SBC',
          battery: '6 hours (ANC on), 30 hours total with case'
        },
        technical: {
          connectivity: 'Bluetooth 5.3, USB-C, MagSafe, Apple Watch charger',
          processor: 'Apple H2 Chip',
          battery: '6 hours listening, 30 hours with case',
          charging: 'USB-C, MagSafe, Qi wireless'
        },
        features: ['Active Noise Cancellation', 'Transparency Mode', 'Adaptive Audio', 'Conversation Awareness', 'Personalized Spatial Audio', 'IP54 Rating']
      }
    },
    {
      id: 'h4',
      name: 'OnePlus Buds 3',
      category: 'headphones',
      price: 6499,
      originalPrice: 7499,
      rating: 4.3,
      seller: 'OnePlus Store',
      image: 'https://m.media-amazon.com/images/I/51HfpCpnt-L._SL1500_.jpg',
      description: 'Hi-Res audio, 49dB ANC, Dual drivers, 44hr total battery',
      tags: ['wireless', 'bluetooth', 'anc', 'budget', 'tws', 'earbuds', 'oneplus', 'under 10000', 'affordable'],
      brand: 'OnePlus',
      stock: 80,
      specs: {
        general: {
          model: 'OnePlus Buds 3',
          color: 'Metallic Gray, Splendid Blue',
          weight: '5.1g each, Case: 40.6g',
          dimensions: 'Earbuds: 31.5 x 22.2 x 24.3mm',
          warranty: '1 Year OnePlus India Warranty'
        },
        audio: {
          driver: '10.4mm + 6mm Dual Drivers',
          frequency: '15Hz - 40kHz',
          anc: 'Yes - Up to 49dB ANC',
          codec: 'LHDC 5.0, AAC, SBC',
          battery: '10 hours (ANC off), 44 hours with case'
        },
        technical: {
          connectivity: 'Bluetooth 5.3, USB-C',
          processor: 'BES2700 Audio SoC',
          battery: '10 hours earbuds, 44 hours total',
          charging: 'USB-C, 10 min = 7 hours'
        },
        features: ['49dB Active Noise Cancellation', 'Hi-Res Audio', 'Dual Drivers', 'Zen Mode Air', 'IP55 Rating', 'Spatial Audio']
      }
    },
    {
      id: 'h5',
      name: 'JBL Tune Flex',
      category: 'headphones',
      price: 6999,
      originalPrice: 8999,
      rating: 4.2,
      seller: 'JBL Auth',
      image: 'https://m.media-amazon.com/images/I/61MwbDxbj5L._SL1500_.jpg',
      description: 'True Adaptive ANC, Ambient Aware, 32hr playtime, IPX4',
      tags: ['wireless', 'bluetooth', 'budget', 'tws', 'earbuds', 'jbl', 'under 10000', 'gym', 'sports', 'waterproof'],
      brand: 'JBL',
      stock: 55,
      specs: {
        general: {
          model: 'JBL Tune Flex',
          color: 'Black, White, Ghost Orange, Blue',
          weight: '6.1g each',
          dimensions: 'Compact TWS design',
          warranty: '1 Year JBL India Warranty'
        },
        audio: {
          driver: '12mm Dynamic Drivers',
          frequency: '20Hz - 20kHz',
          anc: 'Yes - True Adaptive ANC',
          codec: 'SBC, AAC',
          battery: '8 hours (ANC off), 32 hours total'
        },
        technical: {
          connectivity: 'Bluetooth 5.2, USB-C',
          processor: 'JBL Pure Bass Technology',
          battery: '8 hours earbuds, 32 hours with case',
          charging: 'USB-C'
        },
        features: ['True Adaptive ANC', 'Ambient Aware', 'JBL Pure Bass', 'IPX4 Splash Proof', 'Talk Thru', 'Open or Closed Ear Tips']
      }
    },

    // ============ APPLIANCES ============
    {
      id: 'a1',
      name: 'Dyson V12 Detect Slim',
      category: 'appliances',
      price: 49900,
      originalPrice: 58900,
      rating: 4.7,
      seller: 'Dyson India',
      image: 'https://m.media-amazon.com/images/I/51iUZyMm4sL._SL1500_.jpg',
      description: 'Laser dust detect, HEPA filter, Cordless, 60 min runtime',
      tags: ['vacuum cleaner', 'cordless', 'premium', 'dyson', 'home cleaning', 'hepa', 'smart home'],
      brand: 'Dyson',
      stock: 20,
      specs: {
        general: {
          model: 'V12 Detect Slim Absolute',
          color: 'Yellow/Nickel',
          weight: '2.2kg',
          dimensions: '1095 x 250 x 234 mm',
          warranty: '2 Year Dyson India Warranty'
        },
        technical: {
          display: 'LCD screen with real-time particle count',
          processor: 'Dyson Hyperdymium motor, 125,000 RPM',
          battery: '60 minutes (Eco mode), Click-in battery',
          connectivity: 'N/A'
        },
        features: ['Laser Slim Fluffy Head', 'Piezo Sensor Particle Counter', 'HEPA Filtration', 'De-tangling Motorbar', 'LCD Screen', '5 Power Modes']
      }
    },
    {
      id: 'a2',
      name: 'LG Dual Inverter AC 1.5T',
      category: 'appliances',
      price: 43990,
      originalPrice: 52990,
      rating: 4.5,
      seller: 'LG Brand Shop',
      image: 'https://m.media-amazon.com/images/I/41nEYTnMWaL._SL1500_.jpg',
      description: 'AI Convertible 6-in-1, HD Filter with Anti-Virus, 5-Star Rating',
      tags: ['ac', 'air conditioner', 'inverter', 'energy saving', '5 star', 'lg', 'summer', 'cooling'],
      brand: 'LG',
      stock: 15,
      specs: {
        general: {
          model: 'RS-Q19YNZE',
          color: 'White',
          weight: '12.2kg (Indoor)',
          dimensions: '998 x 345 x 210 mm',
          warranty: '1 Year Comprehensive + 10 Years on Compressor'
        },
        technical: {
          display: 'LED Display',
          processor: 'Dual Inverter Compressor',
          battery: 'N/A',
          connectivity: 'LG ThinQ WiFi'
        },
        features: ['5 Star Energy Rating', 'AI Convertible 6-in-1', 'HD Filter with Anti-Virus', 'Dual Inverter Compressor', '4 Way Swing', 'Low Gas Detection']
      }
    },
    {
      id: 'a3',
      name: 'Samsung 7kg EcoBubble Washer',
      category: 'appliances',
      price: 32990,
      originalPrice: 38990,
      rating: 4.4,
      seller: 'Samsung Exclusive',
      image: 'https://m.media-amazon.com/images/I/71r8MsJP54L._SL1500_.jpg',
      description: 'EcoBubble Technology, Hygiene Steam, Digital Inverter, Wi-Fi',
      tags: ['washing machine', 'front load', 'smart', 'samsung', 'laundry', 'eco friendly'],
      brand: 'Samsung',
      stock: 22,
      specs: {
        general: {
          model: 'WW70T502NTW/TL',
          color: 'White',
          weight: '62kg',
          dimensions: '850 x 600 x 550 mm',
          warranty: '2 Years Comprehensive + 20 Years on Motor'
        },
        technical: {
          display: 'LED Display',
          processor: 'Digital Inverter Motor',
          battery: 'N/A',
          connectivity: 'SmartThings WiFi'
        },
        features: ['EcoBubble Technology', 'Hygiene Steam', 'Digital Inverter Motor', 'Drum Clean', 'Stay Clean Drawer', '14 Wash Programs']
      }
    },
    {
      id: 'a4',
      name: 'Philips Airfryer XL',
      category: 'appliances',
      price: 10999,
      originalPrice: 14995,
      rating: 4.6,
      seller: 'Philips ProStore',
      image: 'https://m.media-amazon.com/images/I/51PLZZ9gX0L._SL1500_.jpg',
      description: 'Rapid Air Technology, 7 presets, 1.2kg capacity, Dishwasher safe',
      tags: ['air fryer', 'healthy cooking', 'kitchen', 'philips', 'oil free', 'under 15000'],
      brand: 'Philips',
      stock: 45,
      specs: {
        general: {
          model: 'HD9270/90',
          color: 'Black',
          weight: '5.4kg',
          dimensions: '303 x 315 x 384 mm',
          warranty: '2 Year Philips India Warranty'
        },
        technical: {
          display: 'Digital Touchscreen',
          processor: 'N/A',
          battery: 'N/A',
          connectivity: 'N/A'
        },
        features: ['Rapid Air Technology', '1.2kg Capacity', '7 Preset Programs', 'Fat Removal Technology', 'Dishwasher Safe Parts', 'Up to 90% less fat']
      }
    },
    {
      id: 'a5',
      name: 'Mi Smart Air Purifier 3C',
      category: 'appliances',
      price: 8999,
      originalPrice: 11999,
      rating: 4.3,
      seller: 'Mi Preferred',
      image: 'https://m.media-amazon.com/images/I/51bAKSW6YqL._SL1200_.jpg',
      description: 'True HEPA, 360° intake, App control, 409 sq.ft coverage',
      tags: ['air purifier', 'hepa', 'smart home', 'xiaomi', 'pollution', 'allergy', 'under 10000'],
      brand: 'Xiaomi',
      stock: 35,
      specs: {
        general: {
          model: 'AC-M14-SC',
          color: 'White',
          weight: '4.8kg',
          dimensions: '520 x 240 x 240 mm',
          warranty: '1 Year Xiaomi India Warranty'
        },
        technical: {
          display: 'OLED Touch Display',
          processor: 'N/A',
          battery: 'N/A',
          connectivity: 'WiFi, Mi Home App'
        },
        features: ['True HEPA Filter', '360° Air Intake', '409 sq.ft Coverage', '320 m³/h CADR', 'App Control', 'Voice Control with Alexa/Google']
      }
    },

    // ============ HOME NEEDS ============
    {
      id: 'hn1',
      name: 'IKEA Lersta Floor Lamp',
      category: 'home-needs',
      price: 2999,
      originalPrice: 3499,
      rating: 4.4,
      seller: 'IKEA',
      image: 'https://m.media-amazon.com/images/I/31Y3Z-b6YOL._SL1000_.jpg',
      description: 'Adjustable reading lamp, Aluminum build, Warm glow',
      tags: ['lamp', 'floor lamp', 'lighting', 'ikea', 'home decor', 'reading', 'under 5000'],
      brand: 'IKEA',
      stock: 50,
      specs: {
        general: {
          model: 'LERSTA',
          color: 'Aluminum',
          weight: '2.2kg',
          dimensions: 'Height: 131cm, Base: 25cm',
          warranty: '2 Year IKEA Warranty'
        },
        features: ['Adjustable Arm', 'Directed Reading Light', 'Aluminum Finish', 'E27 Bulb Compatible', 'Energy Efficient']
      }
    },
    {
      id: 'hn2',
      name: 'Wakefit Orthopedic Mattress',
      category: 'home-needs',
      price: 14999,
      originalPrice: 19999,
      rating: 4.7,
      seller: 'Wakefit',
      image: 'https://m.media-amazon.com/images/I/71SdQXbJJtL._SL1500_.jpg',
      description: 'Memory foam, 7-zone support, CertiPUR certified, 10-year warranty',
      tags: ['mattress', 'memory foam', 'orthopedic', 'sleep', 'bedroom', 'wakefit', 'back pain'],
      brand: 'Wakefit',
      stock: 30,
      specs: {
        general: {
          model: 'Orthopedic Memory Foam',
          color: 'White/Grey',
          weight: '35kg (Queen)',
          dimensions: '78 x 60 x 6 inches (Queen)',
          warranty: '10 Year Warranty'
        },
        features: ['7-Zone Support', 'Memory Foam Layer', 'CertiPUR Certified', 'Anti-Microbial', 'Breathable Cover', 'Zero Partner Disturbance']
      }
    },
    {
      id: 'hn3',
      name: 'Duroflex Cloud Pillow (Set of 2)',
      category: 'home-needs',
      price: 2499,
      originalPrice: 3499,
      rating: 4.5,
      seller: 'Duroflex',
      image: 'https://m.media-amazon.com/images/I/61jGD+fNEzL._SL1500_.jpg',
      description: 'Cooling gel memory foam, Hypoallergenic, Machine washable cover',
      tags: ['pillow', 'sleep', 'bedroom', 'cooling', 'hypoallergenic', 'under 5000'],
      brand: 'Duroflex',
      stock: 60,
      specs: {
        general: {
          model: 'Cloud Gel Pillow',
          color: 'White',
          weight: '1.2kg each',
          dimensions: '26 x 16 x 5 inches',
          warranty: '3 Year Warranty'
        },
        features: ['Cooling Gel Layer', 'Memory Foam Core', 'Hypoallergenic', 'Machine Washable Cover', 'Pressure Relief']
      }
    },
    {
      id: 'hn4',
      name: 'Urban Ladder Walnut Bookshelf',
      category: 'home-needs',
      price: 8999,
      originalPrice: 11999,
      rating: 4.4,
      seller: 'Urban Ladder',
      image: 'https://m.media-amazon.com/images/I/61kVJNc9EaL._SL1500_.jpg',
      description: '5-shelf solid wood, Compact footprint, Premium finish',
      tags: ['bookshelf', 'furniture', 'storage', 'wood', 'home decor', 'living room', 'under 10000'],
      brand: 'Urban Ladder',
      stock: 18,
      specs: {
        general: {
          model: 'Malabar Bookshelf',
          color: 'Walnut',
          weight: '25kg',
          dimensions: '150 x 60 x 30 cm',
          warranty: '3 Year Warranty'
        },
        features: ['Solid Mango Wood', '5 Open Shelves', 'Premium Walnut Finish', 'Easy Assembly', 'Weight Capacity: 40kg/shelf']
      }
    },
    {
      id: 'hn5',
      name: 'Aroma Diffuser & Humidifier',
      category: 'home-needs',
      price: 2199,
      originalPrice: 2999,
      rating: 4.3,
      seller: 'CalmHome',
      image: 'https://m.media-amazon.com/images/I/61l6rG7W8bL._SL1500_.jpg',
      description: 'Cool mist, Timer modes, Ambient LED, 300ml tank',
      tags: ['diffuser', 'humidifier', 'aromatherapy', 'wellness', 'home decor', 'under 5000'],
      brand: 'CalmHome',
      stock: 70,
      specs: {
        general: {
          model: 'Ultrasonic Aroma Diffuser',
          color: 'Wood Grain',
          weight: '400g',
          dimensions: '168 x 121 mm',
          warranty: '1 Year Warranty'
        },
        features: ['300ml Tank', 'Cool Mist Technology', '7 LED Colors', '4 Timer Settings', 'Auto Shut-off', 'Whisper Quiet']
      }
    },

    // ============ ELECTRONICS ============
    {
      id: 'e1',
      name: 'MacBook Air M3',
      category: 'electronics',
      price: 114900,
      originalPrice: 124900,
      rating: 4.9,
      seller: 'Apple Authorised',
      image: 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg',
      description: 'Apple M3 chip, 18hr battery, Liquid Retina, 13.6" Display',
      tags: ['laptop', 'macbook', 'apple', 'premium', 'ultrabook', 'work from home', 'professional', 'thin and light'],
      brand: 'Apple',
      stock: 20,
      specs: {
        general: {
          model: 'MacBook Air 13" M3 (2024)',
          color: 'Midnight, Starlight, Space Gray, Silver',
          weight: '1.24kg',
          dimensions: '304.1 x 215 x 11.3 mm',
          warranty: '1 Year Apple Warranty'
        },
        technical: {
          display: '13.6" Liquid Retina, 2560 x 1664, 500 nits, P3 Wide Color',
          processor: 'Apple M3 (8-core CPU, 10-core GPU)',
          ram: '8GB / 16GB / 24GB Unified Memory',
          storage: '256GB / 512GB / 1TB / 2TB SSD',
          battery: 'Up to 18 hours, 70W USB-C Power Adapter',
          connectivity: 'WiFi 6E, Bluetooth 5.3, MagSafe 3, 2x Thunderbolt 4',
          os: 'macOS Sonoma'
        },
        features: ['Apple M3 Chip', '18-Hour Battery', 'Fanless Design', 'Liquid Retina Display', 'MagSafe Charging', '1080p FaceTime HD Camera']
      }
    },
    {
      id: 'e2',
      name: 'Dell XPS 15',
      category: 'electronics',
      price: 139990,
      originalPrice: 159990,
      rating: 4.7,
      seller: 'Dell India',
      image: 'https://m.media-amazon.com/images/I/71P8GmWoruL._SL1500_.jpg',
      description: 'Intel Core i7-13700H, 4K OLED Touch, 32GB RAM, RTX 4050',
      tags: ['laptop', 'windows', 'dell', 'premium', '4k', 'oled', 'professional', 'creator'],
      brand: 'Dell',
      stock: 12,
      specs: {
        general: {
          model: 'XPS 15 9530',
          color: 'Platinum Silver / Black',
          weight: '1.86kg',
          dimensions: '344.4 x 230.1 x 18 mm',
          warranty: '1 Year Dell Premium Support'
        },
        technical: {
          display: '15.6" 4K OLED Touch, 3456 x 2160, 400 nits, 100% DCI-P3',
          processor: 'Intel Core i7-13700H (14 cores, up to 5.0 GHz)',
          ram: '32GB DDR5 4800MHz',
          storage: '1TB PCIe NVMe SSD',
          battery: '86Whr, up to 13 hours',
          connectivity: 'WiFi 6E, Bluetooth 5.3, 2x Thunderbolt 4, SD Card',
          os: 'Windows 11 Home'
        },
        camera: {
          front: '720p with IR for Windows Hello'
        },
        features: ['4K OLED Touch Display', 'NVIDIA RTX 4050 6GB', 'Thunderbolt 4', 'InfinityEdge Display', 'CNC Aluminum Build', 'Studio Quality Mics']
      }
    },
    {
      id: 'e3',
      name: 'iPad Pro 12.9"',
      category: 'electronics',
      price: 112900,
      originalPrice: 124900,
      rating: 4.8,
      seller: 'Apple Authorised',
      image: 'https://m.media-amazon.com/images/I/81c+9BOQNWL._SL1500_.jpg',
      description: 'M2 chip, Liquid Retina XDR, ProMotion 120Hz, Face ID',
      tags: ['tablet', 'ipad', 'apple', 'premium', 'drawing', 'creative', 'professional'],
      brand: 'Apple',
      stock: 15,
      specs: {
        general: {
          model: 'iPad Pro 12.9" (6th Gen)',
          color: 'Space Gray, Silver',
          weight: '682g (WiFi)',
          dimensions: '280.6 x 214.9 x 6.4 mm',
          warranty: '1 Year Apple Warranty'
        },
        technical: {
          display: '12.9" Liquid Retina XDR, 2732 x 2048, ProMotion 120Hz, 1600 nits peak',
          processor: 'Apple M2 (8-core CPU, 10-core GPU)',
          ram: '8GB / 16GB Unified Memory',
          storage: '128GB / 256GB / 512GB / 1TB / 2TB',
          battery: 'Up to 10 hours',
          connectivity: 'WiFi 6E, Bluetooth 5.3, USB-C Thunderbolt/USB 4',
          os: 'iPadOS 17'
        },
        camera: {
          rear: '12MP Wide + 10MP Ultra Wide + LiDAR Scanner',
          front: '12MP TrueDepth',
          video: '4K@60fps, ProRes, Cinematic Mode'
        },
        features: ['Apple M2 Chip', 'Liquid Retina XDR', 'Face ID', 'Apple Pencil 2 Support', 'Magic Keyboard Support', 'Center Stage']
      }
    },
    {
      id: 'e4',
      name: 'Sony PlayStation 5',
      category: 'electronics',
      price: 54990,
      originalPrice: 59990,
      rating: 4.8,
      seller: 'Sony Center',
      image: 'https://m.media-amazon.com/images/I/51mWHXY8hyL._SL1500_.jpg',
      description: '4K@120Hz gaming, DualSense controller, 825GB SSD, Ray Tracing',
      tags: ['gaming', 'console', 'ps5', 'playstation', 'sony', '4k gaming', 'entertainment'],
      brand: 'Sony',
      stock: 10,
      specs: {
        general: {
          model: 'PlayStation 5 (Disc Edition)',
          color: 'White/Black',
          weight: '4.5kg',
          dimensions: '390 x 104 x 260 mm',
          warranty: '1 Year Sony India Warranty'
        },
        technical: {
          display: 'Supports 4K@120Hz, 8K, VRR, HDR',
          processor: 'AMD Zen 2 (8 cores, 3.5 GHz) + AMD RDNA 2 GPU (10.28 TFLOPs)',
          ram: '16GB GDDR6',
          storage: '825GB Custom SSD (5.5GB/s)',
          connectivity: 'WiFi 6, Bluetooth 5.1, HDMI 2.1, USB-A, USB-C',
          os: 'PlayStation OS'
        },
        features: ['DualSense Controller', 'Ray Tracing', 'Tempest 3D AudioTech', 'Ultra-High Speed SSD', 'Backward Compatible (PS4)', '4K Blu-ray Drive']
      }
    },
    {
      id: 'e5',
      name: 'Samsung 55" QLED 4K TV',
      category: 'electronics',
      price: 79990,
      originalPrice: 99990,
      rating: 4.6,
      seller: 'Samsung Exclusive',
      image: 'https://m.media-amazon.com/images/I/71LJQ28RVKL._SL1500_.jpg',
      description: 'Quantum Dot 4K, Dolby Atmos, Smart Hub, 120Hz Gaming Mode',
      tags: ['tv', 'smart tv', '4k', 'qled', 'samsung', 'entertainment', '55 inch', 'home theater'],
      brand: 'Samsung',
      stock: 8,
      specs: {
        general: {
          model: 'QA55Q70CAKLXL',
          color: 'Titan Gray',
          weight: '17.1kg (without stand)',
          dimensions: '1227.4 x 706.4 x 25.9 mm',
          warranty: '2 Year Samsung Warranty'
        },
        technical: {
          display: '55" QLED 4K, 3840 x 2160, 100% Color Volume, Quantum HDR',
          processor: 'Quantum Processor 4K',
          ram: 'N/A',
          storage: 'N/A',
          connectivity: 'WiFi 5, Bluetooth 5.2, 3x HDMI 2.1, 2x USB',
          os: 'Tizen OS'
        },
        audio: {
          driver: '20W 2.0 Channel',
          frequency: 'Object Tracking Sound Lite',
          codec: 'Dolby Atmos, Dolby Digital Plus'
        },
        features: ['Quantum Dot Technology', '120Hz Motion Xcelerator', 'Object Tracking Sound', 'Gaming Hub', 'Smart Hub', 'AirPlay 2']
      }
    },
    {
      id: 'e6',
      name: 'Canon EOS R50',
      category: 'electronics',
      price: 72990,
      originalPrice: 79990,
      rating: 4.5,
      seller: 'Canon Pro',
      image: 'https://m.media-amazon.com/images/I/714YoX91o7L._SL1500_.jpg',
      description: '24.2MP APS-C, 4K video, Dual Pixel AF, Compact mirrorless',
      tags: ['camera', 'mirrorless', 'canon', 'photography', 'vlogging', '4k video', 'content creation'],
      brand: 'Canon',
      stock: 18,
      specs: {
        general: {
          model: 'EOS R50',
          color: 'Black, White',
          weight: '329g (body only)',
          dimensions: '116.3 x 85.5 x 68.8 mm',
          warranty: '2 Year Canon India Warranty'
        },
        technical: {
          display: '2.95" Vari-angle Touchscreen',
          processor: 'DIGIC X Image Processor',
          ram: 'N/A',
          storage: 'SD/SDHC/SDXC (UHS-I)',
          battery: 'LP-E17, 440 shots',
          connectivity: 'WiFi, Bluetooth 4.2, USB Type-C, Micro HDMI'
        },
        camera: {
          rear: '24.2MP APS-C CMOS, ISO 100-32000',
          front: 'N/A',
          video: '4K@30fps Uncropped, Full HD@120fps',
          features: 'Dual Pixel CMOS AF II, Eye AF, Animal AF, 15fps Burst, Creative Assist'
        },
        features: ['24.2MP APS-C Sensor', '4K Uncropped Video', 'Dual Pixel AF', 'Vari-angle Screen', 'Lightweight Body', 'RF Mount']
      }
    },

    // ============ FASHION ============
    {
      id: 'f1',
      name: "Levi's 501 Original Jeans",
      category: 'fashion',
      price: 3999,
      originalPrice: 4999,
      rating: 4.5,
      seller: "Levi's Store",
      image: 'https://m.media-amazon.com/images/I/71i7E9FJrxL._SY879_.jpg',
      description: 'Classic straight fit, 100% cotton denim, Button fly',
      tags: ['jeans', 'denim', 'levis', 'men', 'casual', 'classic', 'under 5000'],
      brand: "Levi's",
      stock: 100,
      specs: {
        general: {
          model: '501 Original Fit',
          color: 'Medium Stonewash, Dark Indigo, Black',
          weight: '450g',
          dimensions: 'Waist: 28-42, Length: 30-34',
          warranty: '6 Months'
        },
        features: ['100% Cotton', 'Button Fly', 'Classic Straight Leg', 'Iconic 501 Styling', 'Machine Washable']
      }
    },
    {
      id: 'f2',
      name: 'Nike Air Max 270',
      category: 'fashion',
      price: 12995,
      originalPrice: 14995,
      rating: 4.6,
      seller: 'Nike Official',
      image: 'https://m.media-amazon.com/images/I/71LPDRyBVXL._SL1500_.jpg',
      description: 'Max Air 270 unit heel, Breathable mesh, All-day comfort',
      tags: ['shoes', 'sneakers', 'nike', 'sports', 'running', 'casual', 'air max', 'under 15000'],
      brand: 'Nike',
      stock: 55,
      specs: {
        general: {
          model: 'Air Max 270',
          color: 'Black/White, Triple White, Various',
          weight: '350g per shoe',
          dimensions: 'UK 6-12',
          warranty: '3 Months Nike Warranty'
        },
        features: ['270° Air Unit', 'Breathable Mesh Upper', 'Foam Midsole', 'Rubber Outsole', 'Pull Tab Heel']
      }
    },
    {
      id: 'f3',
      name: 'Raymond Blazer',
      category: 'fashion',
      price: 8999,
      originalPrice: 12999,
      rating: 4.4,
      seller: 'Raymond Ready',
      image: 'https://m.media-amazon.com/images/I/71wfvQ-PR6L._SY879_.jpg',
      description: 'Premium wool blend, Slim fit, Notch lapel',
      tags: ['blazer', 'formal', 'raymond', 'men', 'office', 'wedding', 'under 10000'],
      brand: 'Raymond',
      stock: 40,
      specs: {
        general: {
          model: 'Slim Fit Blazer',
          color: 'Navy Blue, Charcoal, Black',
          weight: '650g',
          dimensions: 'Size 36-46',
          warranty: '6 Months'
        },
        features: ['Wool-Polyester Blend', 'Slim Fit Cut', 'Notch Lapel', 'Two-Button Closure', 'Inner Pockets', 'Dry Clean Only']
      }
    },
    {
      id: 'f4',
      name: 'H&M Linen Shirt',
      category: 'fashion',
      price: 1999,
      originalPrice: 2499,
      rating: 4.3,
      seller: 'H&M India',
      image: 'https://m.media-amazon.com/images/I/61tIazTpPmL._SY879_.jpg',
      description: '100% linen, Regular fit, Summer essential, Breathable',
      tags: ['shirt', 'linen', 'hm', 'men', 'casual', 'summer', 'under 2000', 'budget'],
      brand: 'H&M',
      stock: 80,
      specs: {
        general: {
          model: 'Regular Fit Linen Shirt',
          color: 'White, Light Blue, Beige, Pink',
          weight: '200g',
          dimensions: 'Size S-XXL',
          warranty: '30 Days Exchange'
        },
        features: ['100% Linen', 'Regular Fit', 'Button-down Collar', 'Single Chest Pocket', 'Machine Washable']
      }
    },
    {
      id: 'f5',
      name: 'Fossil Chronograph Watch',
      category: 'fashion',
      price: 12995,
      originalPrice: 15995,
      rating: 4.5,
      seller: 'Fossil Store',
      image: 'https://m.media-amazon.com/images/I/81X2p8CDovL._SL1500_.jpg',
      description: 'Stainless steel case, Genuine leather strap, 44mm dial',
      tags: ['watch', 'chronograph', 'fossil', 'men', 'accessories', 'gift', 'under 15000'],
      brand: 'Fossil',
      stock: 35,
      specs: {
        general: {
          model: 'Grant Chronograph',
          color: 'Brown Leather/Blue Dial, Black',
          weight: '80g',
          dimensions: '44mm Case, 22mm Strap',
          warranty: '2 Year International Warranty'
        },
        features: ['Stainless Steel Case', 'Genuine Leather Strap', 'Chronograph Movement', 'Water Resistant 50m', 'Date Display']
      }
    },
    {
      id: 'f6',
      name: 'Ray-Ban Aviator Classic',
      category: 'fashion',
      price: 8490,
      originalPrice: 9990,
      rating: 4.7,
      seller: 'Sunglass Hut',
      image: 'https://m.media-amazon.com/images/I/61GKtL8qrUL._SL1500_.jpg',
      description: 'Metal frame, Crystal G-15 lenses, 100% UV protection',
      tags: ['sunglasses', 'aviator', 'rayban', 'unisex', 'accessories', 'uv protection', 'under 10000'],
      brand: 'Ray-Ban',
      stock: 45,
      specs: {
        general: {
          model: 'RB3025 Aviator Classic',
          color: 'Gold/Green, Silver/Blue, Gunmetal/Grey',
          weight: '29g',
          dimensions: 'Lens: 58mm, Bridge: 14mm, Temple: 135mm',
          warranty: '2 Year Ray-Ban Warranty'
        },
        features: ['Crystal G-15 Lenses', '100% UV Protection', 'Metal Frame', 'Adjustable Nose Pads', 'Classic Pilot Shape', 'Made in Italy']
      }
    },

    // ============ BEAUTY ============
    {
      id: 'b1',
      name: 'Dyson Supersonic Hair Dryer',
      category: 'beauty',
      price: 34900,
      originalPrice: 39900,
      rating: 4.8,
      seller: 'Dyson India',
      image: 'https://m.media-amazon.com/images/I/61FqGBxilAS._SL1500_.jpg',
      description: 'Fast drying, No extreme heat damage, Intelligent heat control',
      tags: ['hair dryer', 'dyson', 'premium', 'hair styling', 'salon', 'gift for her'],
      brand: 'Dyson',
      stock: 15,
      specs: {
        general: {
          model: 'Supersonic HD15',
          color: 'Nickel/Copper, Iron/Fuchsia, Prussian Blue/Copper',
          weight: '659g (with magnetic attachments)',
          dimensions: '78 x 97 x 288 mm',
          warranty: '2 Year Dyson India Warranty'
        },
        technical: {
          processor: 'Dyson V9 Digital Motor, 110,000 RPM'
        },
        features: ['Intelligent Heat Control', 'No Extreme Heat', '4 Heat Settings', '3 Speed Settings', 'Cold Shot', 'Magnetic Attachments']
      }
    },
    {
      id: 'b2',
      name: 'Forest Essentials Kumkumadi Oil',
      category: 'beauty',
      price: 2495,
      originalPrice: 2995,
      rating: 4.6,
      seller: 'Forest Essentials',
      image: 'https://m.media-amazon.com/images/I/51eSe96TfpL._SL1500_.jpg',
      description: 'Ayurvedic night serum, Saffron & Sandalwood, For radiant skin',
      tags: ['face oil', 'serum', 'ayurvedic', 'skincare', 'night care', 'under 5000', 'organic'],
      brand: 'Forest Essentials',
      stock: 50,
      specs: {
        general: {
          model: 'Kumkumadi Thailam',
          color: 'N/A',
          weight: '25ml',
          dimensions: 'Dropper Bottle',
          warranty: '12 Months from Manufacturing'
        },
        features: ['Pure Saffron Infused', 'Sandalwood Oil', 'Radiant Complexion', 'Reduces Dark Spots', 'Night Serum', 'Ayurvedic Formula']
      }
    },
    {
      id: 'b3',
      name: 'MAC Ruby Woo Lipstick',
      category: 'beauty',
      price: 1950,
      originalPrice: 2300,
      rating: 4.7,
      seller: 'MAC Cosmetics',
      image: 'https://m.media-amazon.com/images/I/51eLVFP4GPL._SL1500_.jpg',
      description: 'Retro matte finish, Iconic vivid blue-red, Long-wearing',
      tags: ['lipstick', 'mac', 'makeup', 'red lipstick', 'matte', 'under 2000', 'gift'],
      brand: 'MAC',
      stock: 70,
      specs: {
        general: {
          model: 'Retro Matte Lipstick - Ruby Woo',
          color: 'Vivid Blue-Red',
          weight: '3g',
          dimensions: 'Standard Bullet',
          warranty: '36 Months from Manufacturing'
        },
        features: ['Retro Matte Finish', 'High Color Payoff', 'Long-wearing', 'Iconic Shade', 'No Transfer', 'Cruelty-Free']
      }
    },
    {
      id: 'b4',
      name: 'The Ordinary Niacinamide Serum',
      category: 'beauty',
      price: 590,
      originalPrice: 790,
      rating: 4.5,
      seller: 'Nykaa',
      image: 'https://m.media-amazon.com/images/I/51PvVsRXelL._SL1500_.jpg',
      description: '10% Niacinamide + 1% Zinc, Pore minimizer, Blemish control',
      tags: ['serum', 'skincare', 'niacinamide', 'acne', 'pores', 'under 1000', 'budget skincare', 'affordable'],
      brand: 'The Ordinary',
      stock: 120,
      specs: {
        general: {
          model: 'Niacinamide 10% + Zinc 1%',
          color: 'N/A',
          weight: '30ml',
          dimensions: 'Dropper Bottle',
          warranty: '12 Months from Opening'
        },
        features: ['10% Niacinamide', '1% Zinc PCA', 'Reduces Pore Appearance', 'Controls Sebum', 'Water-Based', 'Vegan & Cruelty-Free']
      }
    },
    {
      id: 'b5',
      name: 'Philips Facial Hair Remover',
      category: 'beauty',
      price: 2195,
      originalPrice: 2795,
      rating: 4.4,
      seller: 'Philips ProStore',
      image: 'https://m.media-amazon.com/images/I/51qB3mDjfxL._SL1500_.jpg',
      description: 'Gentle on skin, Cordless, Wet & dry use, Compact design',
      tags: ['hair remover', 'grooming', 'philips', 'women', 'facial', 'under 5000'],
      brand: 'Philips',
      stock: 55,
      specs: {
        general: {
          model: 'BRR454/00',
          color: 'White/Rose Gold',
          weight: '27g',
          dimensions: '28.5 x 28.5 x 106 mm',
          warranty: '2 Year Philips India Warranty'
        },
        features: ['Hypoallergenic Foil', 'Wet & Dry Use', 'Cordless', 'AA Battery Powered', 'Includes Travel Pouch', 'Dermatologist Tested']
      }
    },

    // ============ SPORTS & FITNESS ============
    {
      id: 's1',
      name: 'Nike Dri-FIT Running Tee',
      category: 'sports',
      price: 2495,
      originalPrice: 2995,
      rating: 4.5,
      seller: 'Nike Official',
      image: 'https://m.media-amazon.com/images/I/61pU-W3VNsL._SL1500_.jpg',
      description: 'Dri-FIT moisture-wicking, Breathable mesh, Reflective elements',
      tags: ['tshirt', 'running', 'nike', 'gym', 'fitness', 'sportswear', 'under 5000'],
      brand: 'Nike',
      stock: 90,
      specs: {
        general: {
          model: 'Dri-FIT Running Tee',
          color: 'Black, White, Navy, Red',
          weight: '150g',
          dimensions: 'Size S-XXL',
          warranty: '30 Days Exchange'
        },
        features: ['Dri-FIT Technology', 'Moisture Wicking', 'Breathable Mesh Panels', 'Reflective Elements', 'Slim Fit']
      }
    },
    {
      id: 's2',
      name: 'Yonex Badminton Racket',
      category: 'sports',
      price: 4999,
      originalPrice: 5999,
      rating: 4.6,
      seller: 'Sports Zone',
      image: 'https://m.media-amazon.com/images/I/51aJZZoWMAL._SL1500_.jpg',
      description: 'Astrox 88S, Isometric head, Rotational Generator System',
      tags: ['badminton', 'racket', 'yonex', 'sports', 'outdoor', 'under 5000'],
      brand: 'Yonex',
      stock: 40,
      specs: {
        general: {
          model: 'Astrox 88S Game',
          color: 'Emerald Blue',
          weight: '83g (4U)',
          dimensions: '675mm Length',
          warranty: '6 Months Manufacturing Defects'
        },
        features: ['Isometric Head Shape', 'Rotational Generator System', 'Nanomesh + Carbon', 'Stiff Flex', 'For Attacking Players']
      }
    },
    {
      id: 's3',
      name: 'Fitbit Charge 6',
      category: 'sports',
      price: 14999,
      originalPrice: 17999,
      rating: 4.5,
      seller: 'Fitbit India',
      image: 'https://m.media-amazon.com/images/I/61vPPT4qFKL._SL1500_.jpg',
      description: 'Built-in GPS, Heart rate, SpO2, Stress management, 7-day battery',
      tags: ['fitness tracker', 'smartwatch', 'fitbit', 'health', 'gym', 'under 15000', 'gps'],
      brand: 'Fitbit',
      stock: 35,
      specs: {
        general: {
          model: 'Charge 6',
          color: 'Black, Champagne Gold, Silver',
          weight: '30g',
          dimensions: '39.6 x 17.5 x 11.2 mm',
          warranty: '1 Year Fitbit Warranty'
        },
        technical: {
          display: 'AMOLED Color Touchscreen, Always-on Option',
          processor: 'N/A',
          battery: 'Up to 7 days',
          connectivity: 'Bluetooth 5.0, GPS, NFC (Google Wallet)'
        },
        features: ['Built-in GPS', '24/7 Heart Rate', 'SpO2 Monitoring', 'Sleep Tracking', 'Active Zone Minutes', 'YouTube Music Control', 'Google Maps', 'Water Resistant 50m']
      }
    },
    {
      id: 's4',
      name: 'Decathlon Yoga Mat',
      category: 'sports',
      price: 999,
      originalPrice: 1299,
      rating: 4.4,
      seller: 'Decathlon',
      image: 'https://m.media-amazon.com/images/I/61wn9VR5VsL._SL1500_.jpg',
      description: '8mm thick, Non-slip surface, Eco-friendly TPE, Carrying strap',
      tags: ['yoga', 'mat', 'fitness', 'home workout', 'under 1000', 'budget', 'eco friendly'],
      brand: 'Decathlon',
      stock: 100,
      specs: {
        general: {
          model: 'Comfort Yoga Mat 8mm',
          color: 'Blue, Purple, Green, Grey',
          weight: '1.2kg',
          dimensions: '183 x 61 x 0.8 cm',
          warranty: '2 Year Decathlon Warranty'
        },
        features: ['8mm Cushioning', 'Non-slip Surface', 'TPE Material', 'Eco-friendly', 'Carrying Strap Included', 'Easy Clean']
      }
    },
    {
      id: 's5',
      name: 'Adidas Ultraboost 23',
      category: 'sports',
      price: 16999,
      originalPrice: 19999,
      rating: 4.7,
      seller: 'Adidas Official',
      image: 'https://m.media-amazon.com/images/I/71oBE+KWFpL._SL1500_.jpg',
      description: 'BOOST midsole, Primeknit+ upper, Linear Energy Push, Continental rubber',
      tags: ['running shoes', 'adidas', 'sports', 'marathon', 'premium', 'boost'],
      brand: 'Adidas',
      stock: 30,
      specs: {
        general: {
          model: 'Ultraboost Light',
          color: 'Core Black, Cloud White, Various',
          weight: '290g',
          dimensions: 'UK 6-12',
          warranty: '6 Months Manufacturing Defects'
        },
        features: ['Light BOOST Midsole', 'Primeknit+ Upper', 'Linear Energy Push', 'Continental Rubber Outsole', 'Torsion System', '30% Lighter BOOST']
      }
    },
    {
      id: 's6',
      name: 'Spalding NBA Basketball',
      category: 'sports',
      price: 2999,
      originalPrice: 3499,
      rating: 4.5,
      seller: 'Sports Zone',
      image: 'https://m.media-amazon.com/images/I/81dE+yzKs+L._SL1500_.jpg',
      description: 'Official size 7, Composite leather, Indoor/Outdoor, NBA logo',
      tags: ['basketball', 'nba', 'sports', 'outdoor', 'under 5000'],
      brand: 'Spalding',
      stock: 45,
      specs: {
        general: {
          model: 'NBA Street Ball',
          color: 'Orange/Black',
          weight: '600-650g',
          dimensions: 'Size 7 (Official)',
          warranty: '6 Months'
        },
        features: ['Official Size 7', 'Composite Leather Cover', 'Indoor/Outdoor Use', 'Deep Channels', 'NBA Official Licensed', 'Superior Grip']
      }
    },

    // ============ GROCERY & GOURMET ============
    {
      id: 'g1',
      name: 'Tata Tea Gold 1kg',
      category: 'grocery',
      price: 499,
      originalPrice: 599,
      rating: 4.6,
      seller: 'Tata Consumer',
      image: 'https://m.media-amazon.com/images/I/71VDDX-pBVL._SL1500_.jpg',
      description: '15% long leaf tea, Rich aromatic taste, Premium blend',
      tags: ['tea', 'tata', 'beverages', 'daily essentials', 'under 500', 'grocery'],
      brand: 'Tata',
      stock: 200,
      specs: {
        general: {
          model: 'Tata Tea Gold',
          weight: '1kg',
          warranty: 'Best Before 12 Months'
        },
        features: ['15% Long Leaves', 'Rich Aroma', 'Premium Blend', 'Garden Fresh', 'FSSAI Certified']
      }
    },
    {
      id: 'g2',
      name: 'Nescafe Gold Blend 200g',
      category: 'grocery',
      price: 799,
      originalPrice: 899,
      rating: 4.5,
      seller: 'Nestle Store',
      image: 'https://m.media-amazon.com/images/I/619A0RXk3wL._SL1500_.jpg',
      description: 'Instant coffee, Smooth & rich taste, 100% Arabica beans',
      tags: ['coffee', 'nescafe', 'instant', 'beverages', 'under 1000'],
      brand: 'Nescafe',
      stock: 150,
      specs: {
        general: {
          model: 'Nescafe Gold',
          weight: '200g',
          warranty: 'Best Before 18 Months'
        },
        features: ['100% Arabica & Robusta Blend', 'Freeze-Dried', 'Smooth Taste', 'Rich Aroma', 'Makes ~100 Cups']
      }
    },
    {
      id: 'g3',
      name: 'Basmati Rice 5kg',
      category: 'grocery',
      price: 899,
      originalPrice: 999,
      rating: 4.4,
      seller: 'India Gate',
      image: 'https://m.media-amazon.com/images/I/817wCmAXqRL._SL1500_.jpg',
      description: 'Aged basmati, Long grain, Aromatic, Fluffy texture',
      tags: ['rice', 'basmati', 'staples', 'daily essentials', 'under 1000'],
      brand: 'India Gate',
      stock: 180,
      specs: {
        general: {
          model: 'India Gate Classic',
          weight: '5kg',
          warranty: 'Best Before 24 Months'
        },
        features: ['Extra Long Grain', 'Aged Basmati', 'Fluffy Texture', 'Natural Aroma', 'Pesticide Free']
      }
    },
    {
      id: 'g4',
      name: 'Organic Honey 500g',
      category: 'grocery',
      price: 449,
      originalPrice: 549,
      rating: 4.5,
      seller: 'Dabur',
      image: 'https://m.media-amazon.com/images/I/61iDj-FpHVL._SL1500_.jpg',
      description: '100% pure honey, No added sugar, Natural immunity booster',
      tags: ['honey', 'organic', 'natural', 'healthy', 'under 500'],
      brand: 'Dabur',
      stock: 120,
      specs: {
        general: {
          model: 'Dabur Organic Honey',
          weight: '500g',
          warranty: 'Best Before 24 Months'
        },
        features: ['100% Pure', 'No Added Sugar', 'Organic Certified', 'Natural Immunity Booster', 'FSSAI Approved']
      }
    },
    {
      id: 'g5',
      name: 'Amul Butter 500g',
      category: 'grocery',
      price: 285,
      originalPrice: 310,
      rating: 4.7,
      seller: 'Amul Store',
      image: 'https://m.media-amazon.com/images/I/71e5cUwHAaL._SL1500_.jpg',
      description: 'Pasteurized butter, Creamy texture, Made from fresh cream',
      tags: ['butter', 'dairy', 'amul', 'daily essentials', 'under 500'],
      brand: 'Amul',
      stock: 250,
      specs: {
        general: {
          model: 'Amul Butter',
          weight: '500g',
          warranty: 'Refrigerate, Use within 90 days'
        },
        features: ['Made from Milk', 'Rich & Creamy', 'Pasteurized', 'Vitamin A & D Fortified', 'No Preservatives']
      }
    },

    // ============ BOOKS & STATIONERY ============
    {
      id: 'bk1',
      name: 'Atomic Habits by James Clear',
      category: 'books',
      price: 499,
      originalPrice: 699,
      rating: 4.8,
      seller: 'Amazon Books',
      image: 'https://m.media-amazon.com/images/I/81ANaVZk5LL._SL1500_.jpg',
      description: 'International bestseller, Build good habits, Break bad ones',
      tags: ['book', 'self help', 'bestseller', 'habits', 'motivation', 'under 500'],
      brand: 'Penguin',
      stock: 200,
      specs: {
        general: {
          model: 'Paperback Edition',
          weight: '350g',
          dimensions: '320 pages',
          warranty: 'N/A'
        },
        features: ['International Bestseller', 'Practical Strategies', 'Science-backed', 'Easy to Read', 'Life-changing']
      }
    },
    {
      id: 'bk2',
      name: 'The Psychology of Money',
      category: 'books',
      price: 399,
      originalPrice: 499,
      rating: 4.7,
      seller: 'Penguin India',
      image: 'https://m.media-amazon.com/images/I/71TRUbzcvaL._SL1500_.jpg',
      description: 'Morgan Housel, Timeless lessons on wealth and happiness',
      tags: ['book', 'finance', 'bestseller', 'money', 'investing', 'under 500'],
      brand: 'Penguin',
      stock: 180,
      specs: {
        general: {
          model: 'Paperback Edition',
          weight: '300g',
          dimensions: '256 pages',
          warranty: 'N/A'
        },
        features: ['Financial Wisdom', 'Behavioral Finance', 'Easy Stories', '#1 Bestseller', 'Timeless Lessons']
      }
    },
    {
      id: 'bk3',
      name: 'Parker Vector Fountain Pen',
      category: 'books',
      price: 395,
      originalPrice: 495,
      rating: 4.5,
      seller: 'Parker Store',
      image: 'https://m.media-amazon.com/images/I/61xNxSSCQdL._SL1500_.jpg',
      description: 'Stainless steel nib, Medium point, Classic design, Gift box',
      tags: ['pen', 'fountain pen', 'parker', 'stationery', 'gift', 'under 500'],
      brand: 'Parker',
      stock: 100,
      specs: {
        general: {
          model: 'Vector Standard CT',
          color: 'Black, Blue, Red',
          weight: '21g',
          dimensions: '132mm Length',
          warranty: '2 Year Parker Warranty'
        },
        features: ['Stainless Steel Nib', 'Medium Point', 'Refillable', 'Classic Design', 'Gift Box Included']
      }
    },
    {
      id: 'bk4',
      name: 'Classmate Notebook Set (6 Pack)',
      category: 'books',
      price: 299,
      originalPrice: 399,
      rating: 4.4,
      seller: 'ITC Stationery',
      image: 'https://m.media-amazon.com/images/I/71GlDjpuuDL._SL1500_.jpg',
      description: '200 pages each, Single line ruled, A4 size, Premium paper',
      tags: ['notebook', 'stationery', 'school', 'office', 'under 500', 'budget'],
      brand: 'Classmate',
      stock: 300,
      specs: {
        general: {
          model: 'Pulse Notebook Pack',
          color: 'Assorted Covers',
          weight: '1.5kg (pack)',
          dimensions: 'A4 Size (297 x 210 mm)',
          warranty: 'N/A'
        },
        features: ['200 Pages Each', 'Single Line Ruled', 'Spiral Bound', 'Premium Quality Paper', 'Eco-friendly']
      }
    },
    {
      id: 'bk5',
      name: 'Kindle Paperwhite',
      category: 'books',
      price: 13999,
      originalPrice: 15999,
      rating: 4.7,
      seller: 'Amazon Devices',
      image: 'https://m.media-amazon.com/images/I/61BHkOALbmL._SL1000_.jpg',
      description: '6.8" display, Adjustable warm light, IPX8 waterproof, 8 weeks battery',
      tags: ['kindle', 'ereader', 'amazon', 'reading', 'gift', 'under 15000', 'waterproof'],
      brand: 'Amazon',
      stock: 50,
      specs: {
        general: {
          model: 'Kindle Paperwhite (11th Gen)',
          color: 'Black, Denim, Agave Green',
          weight: '205g',
          dimensions: '174 x 125 x 8.1 mm',
          warranty: '1 Year Amazon India Warranty'
        },
        technical: {
          display: '6.8" Paperwhite, 300 ppi, 16 Grey Levels, Adjustable Warm Light',
          processor: 'N/A',
          storage: '8GB / 16GB',
          battery: 'Up to 10 weeks',
          connectivity: 'WiFi, USB-C'
        },
        features: ['6.8" Glare-Free Display', '300 ppi Resolution', 'Adjustable Warm Light', 'IPX8 Waterproof', '8 Weeks Battery', 'USB-C Charging']
      }
    },

    // ============ TOYS & GAMES ============
    {
      id: 'toy1',
      name: 'LEGO Technic Bugatti Chiron 42083',
      category: 'toys',
      price: 34999,
      originalPrice: 42999,
      rating: 4.9,
      seller: 'LEGO Official',
      image: 'https://m.media-amazon.com/images/I/81mJ-oLKSiL._SL1500_.jpg',
      description: '3,599 pieces, 1:8 scale model, Movable W16 engine, Authentic details',
      tags: ['lego', 'technic', 'building', 'educational', 'premium', 'gift', 'collectible', 'toys'],
      brand: 'LEGO',
      stock: 25,
      specs: {
        general: {
          model: 'Technic Bugatti Chiron 42083',
          color: 'Blue / Black',
          weight: '3.85kg',
          dimensions: '56 x 25 x 14 cm (built)',
          warranty: 'LEGO Quality Guarantee'
        },
        features: ['3,599 Pieces', '1:8 Scale', 'Movable W16 Engine', 'Active Rear Wing', '8-Speed Gearbox', 'Detailed Interior']
      }
    },
    {
      id: 'toy2',
      name: 'Funskool Monopoly Classic Board Game',
      category: 'toys',
      price: 599,
      originalPrice: 799,
      rating: 4.5,
      seller: 'Funskool India',
      image: 'https://m.media-amazon.com/images/I/81oC5pYhh2L._SL1500_.jpg',
      description: 'Classic property trading game, 2-8 players, Family entertainment',
      tags: ['boardgames', 'monopoly', 'family', 'party', 'classic', 'under 1000', 'toys'],
      brand: 'Funskool',
      stock: 100,
      specs: {
        general: {
          model: 'Monopoly Classic',
          players: '2-8 Players',
          age: '8+ Years',
          warranty: '6 Months Manufacturer Warranty'
        },
        features: ['Classic Board Game', 'Property Trading', '2-8 Players', 'Includes Game Board, Cards, Tokens, Money', 'Family Fun', 'Strategic Gameplay']
      }
    },
    {
      id: 'toy3',
      name: 'Hot Wheels 20-Car Gift Pack',
      category: 'toys',
      price: 1499,
      originalPrice: 1999,
      rating: 4.6,
      seller: 'Mattel Store',
      image: 'https://m.media-amazon.com/images/I/91SVn6UoQYL._SL1500_.jpg',
      description: '20 die-cast vehicles, 1:64 scale, Authentic designs, Collectible',
      tags: ['cars', 'action', 'diecast', 'collectible', 'gift', 'under 2000', 'toys'],
      brand: 'Hot Wheels',
      stock: 80,
      specs: {
        general: {
          model: 'Hot Wheels 20-Car Pack',
          scale: '1:64',
          age: '3+ Years',
          warranty: 'Mattel Quality Guarantee'
        },
        features: ['20 Die-Cast Vehicles', '1:64 Scale', 'Authentic Designs', 'Gift-Ready Packaging', 'Collectible', 'Compatible with Tracks']
      }
    },

    // ============ AUTOMOTIVE ============
    {
      id: 'auto1',
      name: '3M Car Care Kit - Complete',
      category: 'automotive',
      price: 2499,
      originalPrice: 3199,
      rating: 4.5,
      seller: '3M Auto Care',
      image: 'https://m.media-amazon.com/images/I/71mXr6TX3jL._SL1500_.jpg',
      description: 'Car shampoo, dashboard polish, glass cleaner, microfiber cloth, wax',
      tags: ['carcare', 'cleaning', 'polish', 'maintenance', 'under 3000', 'automotive'],
      brand: '3M',
      stock: 75,
      specs: {
        general: {
          model: '3M Complete Car Care Kit',
          weight: '2.5kg',
          warranty: 'Best Before 24 Months'
        },
        features: ['Car Shampoo 500ml', 'Dashboard Polish', 'Glass Cleaner', 'Microfiber Cloth (2pc)', 'Car Wax 200g', 'All-in-One Kit']
      }
    },
    {
      id: 'auto2',
      name: 'Bosch Aerotwin Wiper Blades (Pair)',
      category: 'automotive',
      price: 1299,
      originalPrice: 1699,
      rating: 4.4,
      seller: 'Bosch Automotive',
      image: 'https://m.media-amazon.com/images/I/61jL3Iy8URL._SL1500_.jpg',
      description: 'Flat blade design, Streak-free wiping, Universal fit, All-weather',
      tags: ['spareparts', 'wipers', 'bosch', 'essential', 'under 2000', 'automotive'],
      brand: 'Bosch',
      stock: 90,
      specs: {
        general: {
          model: 'Aerotwin AR24/19',
          size: '24" + 19"',
          compatibility: 'Universal Multi-Adapter',
          warranty: '1 Year Bosch Warranty'
        },
        features: ['Flat Blade Technology', 'Streak-Free Wiping', 'All-Weather Performance', 'Universal Fit', 'Easy Installation', 'Low Noise']
      }
    },
    {
      id: 'auto3',
      name: 'Steelbird SBA-7 Helmet ISI Certified',
      category: 'automotive',
      price: 1699,
      originalPrice: 2199,
      rating: 4.3,
      seller: 'Steelbird Official',
      image: 'https://m.media-amazon.com/images/I/51VE67RsjbL._SL1100_.jpg',
      description: 'Full-face helmet, ISI certified, Clear visor, Aerodynamic design',
      tags: ['helmets', 'safety', 'bikeaccessories', 'riding', 'under 2000', 'automotive'],
      brand: 'Steelbird',
      stock: 60,
      specs: {
        general: {
          model: 'SBA-7 Wings',
          color: 'Matt Black / Glossy Black',
          weight: '1.2kg',
          warranty: '1 Year Manufacturer Warranty'
        },
        features: ['ISI Certified (IS 4151)', 'Full-Face Protection', 'Clear Anti-Scratch Visor', 'Aerodynamic Design', 'Padded Interior', 'Quick-Release Buckle']
      }
    },

    // ============ JEWELRY & WATCHES ============
    {
      id: 'jew1',
      name: 'Tanishq 22K Gold Chain 10g',
      category: 'jewelry',
      price: 62999,
      originalPrice: 65999,
      rating: 4.8,
      seller: 'Tanishq Official',
      image: 'https://m.media-amazon.com/images/I/51x0GGVxp7L._SL1500_.jpg',
      description: '22 Karat hallmarked gold, BIS certified, Classic design, Daily wear',
      tags: ['gold', 'chain', 'hallmarked', 'premium', 'tanishq', 'jewelry'],
      brand: 'Tanishq',
      stock: 15,
      specs: {
        general: {
          model: 'Classic Gold Chain',
          purity: '22 Karat (916)',
          weight: '10 grams',
          certification: 'BIS Hallmarked',
          warranty: 'Tanishq Lifetime Exchange'
        },
        features: ['22K Gold (916 Purity)', 'BIS Hallmarked', 'Classic Curb Design', 'Suitable for Daily Wear', 'Lifetime Exchange', 'Gift-Ready Packaging']
      }
    },
    {
      id: 'jew2',
      name: 'Fossil Grant Chronograph Watch',
      category: 'jewelry',
      price: 8995,
      originalPrice: 11995,
      rating: 4.6,
      seller: 'Fossil Store',
      image: 'https://m.media-amazon.com/images/I/71sT5mfcLKL._SL1500_.jpg',
      description: 'Genuine leather strap, Chronograph dial, 44mm case, Water resistant',
      tags: ['watches', 'fossil', 'chronograph', 'leather', 'under 10000', 'gift', 'jewelry'],
      brand: 'Fossil',
      stock: 40,
      specs: {
        general: {
          model: 'Grant FS4735',
          color: 'Brown Leather / Blue Dial',
          weight: '80g',
          warranty: '2 Year International Warranty'
        },
        technical: {
          movement: 'Quartz Chronograph',
          caseSize: '44mm',
          caseMaterial: 'Stainless Steel',
          waterResistance: '5 ATM (50m)',
          strap: 'Genuine Leather'
        },
        features: ['Chronograph Movement', '44mm Case', 'Genuine Leather Strap', '5 ATM Water Resistant', 'Roman Numeral Dial', 'Date Display']
      }
    },
    {
      id: 'jew3',
      name: 'Swarovski Crystal Pendant Necklace',
      category: 'jewelry',
      price: 5499,
      originalPrice: 6999,
      rating: 4.7,
      seller: 'Swarovski India',
      image: 'https://m.media-amazon.com/images/I/61FkR-OlhDL._SL1500_.jpg',
      description: 'Austrian crystal, Rhodium plated, Elegant teardrop design, Gift box included',
      tags: ['silver', 'crystal', 'pendant', 'necklace', 'gift', 'under 6000', 'jewelry', 'diamonds'],
      brand: 'Swarovski',
      stock: 35,
      specs: {
        general: {
          model: 'Millenia Teardrop Pendant',
          color: 'White / Rhodium Plated',
          weight: '15g',
          warranty: '2 Year Swarovski Warranty'
        },
        features: ['Austrian Crystal', 'Rhodium Plated', 'Teardrop Design', 'Adjustable Chain (38-44cm)', 'Lobster Clasp', 'Premium Gift Box']
      }
    }
  ];
  global.productsData = productsData;
})(window);
