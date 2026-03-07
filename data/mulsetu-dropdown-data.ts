// mulsetu-dropdown-data.ts

// Copy-pasteable dataset for produce and markets

export const produceOptions: string[] = [
  'Amla(Nelli Kai)',
  'Apple',
  'Apricot(Jardalu/Khumani)',
  'Avocado',
  'Bael',
  'Banana',
  'Ber(Zizyphus/Borehannu)',
  'Bilimbi',
  'Black Currant',
  'Blueberry',
  'Borehannu',
  'Bread Fruit',
  'Carissa(Karvand)',
  'Chakotha',
  'Cherry',
  'Chikoos(Sapota)',
  'Custard Apple(Sharifa)',
  'Dragon fruit',
  'Garcinia',
  'Goose berry(Nellikkai)',
  'Grapes',
  'Grey Fruit',
  'Guava',
  'Hog Plum',
  'Indian Sherbet Berry(Phalsa)',
  'Jack Fruit',
  'Jamun(Narale Hannu)',
  'Karbuja(Musk Melon)',
  'Khirni',
  'Kinnow',
  'Kiwi Fruit',
  'Lime',
  'Litchi',
  'Lukad',
  'Mango',
  'Mangosteen',
  'Marasebu',
  'Mousambi(Sweet Lime)',
  'Mulberry',
  'Nearle Hannu',
  'Nelli Kai',
  'Orange',
  'Papaya',
  'Passion Fruit',
  'Peach',
  'Pear(Marasebu)',
  'Persimon(Japani Fal)',
  'Pineapple',
  'Plum',
  'Pomegranate',
  'Quince(Nakh)',
  'Rambutan',
  'Ramphal',
  'Seetapal',
  'Siddota',
  'Soursop',
  'Star Fruit(Kamraikh)',
  'Strawberry',
  'Tender Coconut',
  'Water Apple',
  'Water Melon',
  'Wild Melon',
  'Wild lemon',
  'Wood Apple',
];

// Comprehensive India Market Data - State → District → Markets
export const marketOptions: {
  label: string;
  value: string;
  districts: { label: string; value: string; markets: { label: string; value: string }[] }[];
}[] = [
  {
    label: "Andhra Pradesh",
    value: "Andhra Pradesh",
    districts: [
      { label: "Guntur", value: "Guntur", markets: [
        { label: "Guntur Mirchi Yard", value: "Guntur Mirchi Yard" },
        { label: "Tenali", value: "Tenali" },
        { label: "Narasaraopet", value: "Narasaraopet" },
        { label: "Vinukonda", value: "Vinukonda" }
      ]},
      { label: "Chittoor", value: "Chittoor", markets: [
        { label: "Madanapalle", value: "Madanapalle" },
        { label: "Palamaner", value: "Palamaner" },
        { label: "Chittoor", value: "Chittoor" },
        { label: "Tirupati", value: "Tirupati" }
      ]},
      { label: "East Godavari", value: "East Godavari", markets: [
        { label: "Rajahmundry", value: "Rajahmundry" },
        { label: "Kakinada", value: "Kakinada" },
        { label: "Amalapuram", value: "Amalapuram" },
        { label: "Ramachandrapuram", value: "Ramachandrapuram" }
      ]},
      { label: "Kurnool", value: "Kurnool", markets: [
        { label: "Kurnool", value: "Kurnool" },
        { label: "Adoni", value: "Adoni" },
        { label: "Nandyal", value: "Nandyal" },
        { label: "Yemmiganur", value: "Yemmiganur" }
      ]},
      { label: "Krishna", value: "Krishna", markets: [
        { label: "Vijayawada", value: "Vijayawada" },
        { label: "Machilipatnam", value: "Machilipatnam" },
        { label: "Gudivada", value: "Gudivada" }
      ]}
    ]
  },
  {
    label: "Gujarat",
    value: "Gujarat",
    districts: [
      { label: "Ahmedabad", value: "Ahmedabad", markets: [
        { label: "Ahmedabad (Jamalpur)", value: "Ahmedabad (Jamalpur)" },
        { label: "Ahmedabad(Chimanbhai Patal Market Vasana)", value: "Ahmedabad(Chimanbhai Patal Market Vasana)" },
        { label: "Sabarmati", value: "Sabarmati" },
        { label: "Naroda", value: "Naroda" }
      ]},
      { label: "Surat", value: "Surat", markets: [
        { label: "Surat APMC", value: "Surat APMC" },
        { label: "Varachha", value: "Varachha" },
        { label: "Katargam", value: "Katargam" }
      ]},
      { label: "Rajkot", value: "Rajkot", markets: [
        { label: "Rajkot", value: "Rajkot" },
        { label: "Gondal", value: "Gondal" },
        { label: "Jetpur", value: "Jetpur" }
      ]},
      { label: "Mehsana", value: "Mehsana", markets: [
        { label: "Unjha", value: "Unjha" },
        { label: "Mehsana", value: "Mehsana" },
        { label: "Visnagar", value: "Visnagar" }
      ]},
      { label: "Anand", value: "Anand", markets: [
        { label: "Anand(Veg,Yard,Anand)", value: "Anand(Veg,Yard,Anand)" },
        { label: "Borsad", value: "Borsad" },
        { label: "Petlad", value: "Petlad" }
      ]},
      { label: "Vadodara", value: "Vadodara", markets: [
        { label: "Vadodara", value: "Vadodara" },
        { label: "Padra", value: "Padra" },
        { label: "Karjan", value: "Karjan" }
      ]}
    ]
  },
  {
    label: "Karnataka",
    value: "Karnataka",
    districts: [
      { label: "Bengaluru Urban", value: "Bengaluru Urban", markets: [
        { label: "Bengaluru (K.R. Market)", value: "Bengaluru (K.R. Market)" },
        { label: "Yeshwanthpura APMC Yard", value: "Yeshwanthpura APMC Yard" },
        { label: "Kalasipalyam", value: "Kalasipalyam" },
        { label: "Russell Market", value: "Russell Market" }
      ]},
      { label: "Mysuru", value: "Mysuru", markets: [
        { label: "Mysuru (Bandipalya APMC)", value: "Mysuru (Bandipalya APMC)" },
        { label: "Nanjangud", value: "Nanjangud" },
        { label: "Mandya", value: "Mandya" },
        { label: "Srirangapatna", value: "Srirangapatna" }
      ]},
      { label: "Belagavi", value: "Belagavi", markets: [
        { label: "Belagavi", value: "Belagavi" },
        { label: "Gokak", value: "Gokak" },
        { label: "Bailhongal", value: "Bailhongal" },
        { label: "Kittur", value: "Kittur" }
      ]},
      { label: "Kolar", value: "Kolar", markets: [
        { label: "Kolar APMC", value: "Kolar APMC" },
        { label: "Srinivaspura", value: "Srinivaspura" },
        { label: "Malur", value: "Malur" },
        { label: "Bangarpet", value: "Bangarpet" }
      ]},
      { label: "Dakshina Kannada", value: "Dakshina Kannada", markets: [
        { label: "Mangaluru", value: "Mangaluru" },
        { label: "Udupi", value: "Udupi" },
        { label: "Karkala", value: "Karkala" }
      ]}
    ]
  },
  {
    label: "Kerala",
    value: "Kerala",
    districts: [
      { label: "Ernakulam", value: "Ernakulam", markets: [
        { label: "Aluva", value: "Aluva" },
        { label: "Angamaly", value: "Angamaly" },
        { label: "Kochi", value: "Kochi" },
        { label: "Perumbavoor", value: "Perumbavoor" }
      ]},
      { label: "Kollam", value: "Kollam", markets: [
        { label: "Anchal", value: "Anchal" },
        { label: "Kollam", value: "Kollam" },
        { label: "Karunagappally", value: "Karunagappally" }
      ]},
      { label: "Alappuzha", value: "Alappuzha", markets: [
        { label: "Aroor", value: "Aroor" },
        { label: "Alappuzha", value: "Alappuzha" },
        { label: "Cherthala", value: "Cherthala" }
      ]},
      { label: "Thiruvananthapuram", value: "Thiruvananthapuram", markets: [
        { label: "Thiruvananthapuram", value: "Thiruvananthapuram" },
        { label: "Neyyattinkara", value: "Neyyattinkara" },
        { label: "Attingal", value: "Attingal" }
      ]}
    ]
  },
  {
    label: "Madhya Pradesh",
    value: "Madhya Pradesh",
    districts: [
      { label: "Indore", value: "Indore", markets: [
        { label: "Indore (Choithram Mandi)", value: "Indore (Choithram Mandi)" },
        { label: "Rajwada", value: "Rajwada" },
        { label: "Sarafa Bazaar", value: "Sarafa Bazaar" }
      ]},
      { label: "Bhopal", value: "Bhopal", markets: [
        { label: "Bhopal (Karond Mandi)", value: "Bhopal (Karond Mandi)" },
        { label: "New Market", value: "New Market" },
        { label: "Bittan Market", value: "Bittan Market" }
      ]},
      { label: "Ujjain", value: "Ujjain", markets: [
        { label: "Ujjain", value: "Ujjain" },
        { label: "Mahakaleshwar", value: "Mahakaleshwar" },
        { label: "Freeganj", value: "Freeganj" }
      ]},
      { label: "Jabalpur", value: "Jabalpur", markets: [
        { label: "Jabalpur", value: "Jabalpur" },
        { label: "Gorakhpur", value: "Gorakhpur" },
        { label: "Wright Town", value: "Wright Town" }
      ]},
      { label: "Ratlam", value: "Ratlam", markets: [
        { label: "A lot", value: "A lot" },
        { label: "Ratlam", value: "Ratlam" },
        { label: "Jaora", value: "Jaora" }
      ]},
      { label: "Shajapur", value: "Shajapur", markets: [
        { label: "Agar", value: "Agar" },
        { label: "Shajapur", value: "Shajapur" },
        { label: "Soyatkalan", value: "Soyatkalan" }
      ]},
      { label: "Sehore", value: "Sehore", markets: [
        { label: "Ashta", value: "Ashta" },
        { label: "Sehore", value: "Sehore" },
        { label: "Ichhawar", value: "Ichhawar" }
      ]}
    ]
  },
  {
    label: "Maharashtra",
    value: "Maharashtra",
    districts: [
      { label: "Pune", value: "Pune", markets: [
        { label: "Pune (Gultekdi Market Yard)", value: "Pune (Gultekdi Market Yard)" },
        { label: "Baramati", value: "Baramati" },
        { label: "Manchar", value: "Manchar" },
        { label: "Junnar", value: "Junnar" },
        { label: "Shirur", value: "Shirur" }
      ]},
      { label: "Nashik", value: "Nashik", markets: [
        { label: "Nashik", value: "Nashik" },
        { label: "Lasalgaon", value: "Lasalgaon" },
        { label: "Pimpalgaon", value: "Pimpalgaon" },
        { label: "Malegaon", value: "Malegaon" },
        { label: "Sinnar", value: "Sinnar" }
      ]},
      { label: "Mumbai", value: "Mumbai", markets: [
        { label: "Vashi APMC", value: "Vashi APMC" },
        { label: "Crawford Market", value: "Crawford Market" },
        { label: "Dadar", value: "Dadar" },
        { label: "Borivali", value: "Borivali" }
      ]},
      { label: "Nagpur", value: "Nagpur", markets: [
        { label: "Nagpur (Kalamna Market)", value: "Nagpur (Kalamna Market)" },
        { label: "Maharajbagh", value: "Maharajbagh" },
        { label: "Itwari", value: "Itwari" }
      ]},
      { label: "Akola", value: "Akola", markets: [
        { label: "Akola", value: "Akola" },
        { label: "Washim", value: "Washim" },
        { label: "Murtizapur", value: "Murtizapur" }
      ]},
      { label: "Ahmednagar", value: "Ahmednagar", markets: [
        { label: "Akole", value: "Akole" },
        { label: "Ahmednagar", value: "Ahmednagar" },
        { label: "Kopargaon", value: "Kopargaon" }
      ]},
      { label: "Kolhapur", value: "Kolhapur", markets: [
        { label: "Kolhapur", value: "Kolhapur" },
        { label: "Ichalkaranji", value: "Ichalkaranji" },
        { label: "Kagal", value: "Kagal" }
      ]}
    ]
  },
  {
    label: "Punjab",
    value: "Punjab",
    districts: [
      { label: "Ludhiana", value: "Ludhiana", markets: [
        { label: "Ludhiana", value: "Ludhiana" },
        { label: "Khanna", value: "Khanna" },
        { label: "Jagraon", value: "Jagraon" },
        { label: "Raikot", value: "Raikot" }
      ]},
      { label: "Amritsar", value: "Amritsar", markets: [
        { label: "Amritsar", value: "Amritsar" },
        { label: "Amritsar(Amritsar Mewa Mandi)", value: "Amritsar(Amritsar Mewa Mandi)" },
        { label: "Tarn Taran", value: "Tarn Taran" },
        { label: "Ajnala", value: "Ajnala" }
      ]},
      { label: "Jalandhar", value: "Jalandhar", markets: [
        { label: "Jalandhar", value: "Jalandhar" },
        { label: "Nakodar", value: "Nakodar" },
        { label: "Phillaur", value: "Phillaur" }
      ]},
      { label: "Patiala", value: "Patiala", markets: [
        { label: "Patiala", value: "Patiala" },
        { label: "Rajpura", value: "Rajpura" },
        { label: "Nabha", value: "Nabha" },
        { label: "Samana", value: "Samana" }
      ]},
      { label: "Sangrur", value: "Sangrur", markets: [
        { label: "Ahmedgarh", value: "Ahmedgarh" },
        { label: "Sangrur", value: "Sangrur" },
        { label: "Sunam", value: "Sunam" }
      ]},
      { label: "Bathinda", value: "Bathinda", markets: [
        { label: "Bathinda", value: "Bathinda" },
        { label: "Mansa", value: "Mansa" },
        { label: "Talwandi Sabo", value: "Talwandi Sabo" }
      ]}
    ]
  },
  {
    label: "Rajasthan",
    value: "Rajasthan",
    districts: [
      { label: "Ajmer", value: "Ajmer", markets: [
        { label: "Ajmer(F&V)", value: "Ajmer(F&V)" },
        { label: "Kishangarh", value: "Kishangarh" },
        { label: "Beawar", value: "Beawar" }
      ]},
      { label: "Jaipur", value: "Jaipur", markets: [
        { label: "Jaipur", value: "Jaipur" },
        { label: "Sanganer", value: "Sanganer" },
        { label: "Amer", value: "Amer" }
      ]},
      { label: "Jodhpur", value: "Jodhpur", markets: [
        { label: "Jodhpur", value: "Jodhpur" },
        { label: "Pali", value: "Pali" },
        { label: "Sojat", value: "Sojat" }
      ]},
      { label: "Udaipur", value: "Udaipur", markets: [
        { label: "Udaipur", value: "Udaipur" },
        { label: "Chittorgarh", value: "Chittorgarh" },
        { label: "Banswara", value: "Banswara" }
      ]}
    ]
  },
  {
    label: "Tamil Nadu",
    value: "Tamil Nadu",
    districts: [
      { label: "Chennai", value: "Chennai", markets: [
        { label: "Koyambedu Market", value: "Koyambedu Market" },
        { label: "Thiruvanmiyur", value: "Thiruvanmiyur" },
        { label: "Anna Nagar", value: "Anna Nagar" }
      ]},
      { label: "Coimbatore", value: "Coimbatore", markets: [
        { label: "Coimbatore (MGR Market)", value: "Coimbatore (MGR Market)" },
        { label: "Pollachi", value: "Pollachi" },
        { label: "Tiruppur", value: "Tiruppur" }
      ]},
      { label: "Madurai", value: "Madurai", markets: [
        { label: "Madurai Central Market", value: "Madurai Central Market" },
        { label: "Anaiyur(Uzhavar Sandhai)", value: "Anaiyur(Uzhavar Sandhai)" },
        { label: "Anna nagar(Uzhavar Sandhai)", value: "Anna nagar(Uzhavar Sandhai)" },
        { label: "Melur", value: "Melur" }
      ]},
      { label: "Dindigul", value: "Dindigul", markets: [
        { label: "Oddanchatram", value: "Oddanchatram" },
        { label: "Dindigul", value: "Dindigul" },
        { label: "Palani", value: "Palani" }
      ]},
      { label: "Dharmapuri", value: "Dharmapuri", markets: [
        { label: "AJattihalli(Uzhavar Sandhai)", value: "AJattihalli(Uzhavar Sandhai)" },
        { label: "Dharmapuri", value: "Dharmapuri" },
        { label: "Harur", value: "Harur" }
      ]},
      { label: "Pudukkottai", value: "Pudukkottai", markets: [
        { label: "Alangudi(Uzhavar Sandhai)", value: "Alangudi(Uzhavar Sandhai)" },
        { label: "Aranthangi(Uzhavar Sandhai)", value: "Aranthangi(Uzhavar Sandhai)" },
        { label: "Pudukkottai", value: "Pudukkottai" }
      ]},
      { label: "Thiruvellore", value: "Thiruvellore", markets: [
        { label: "Ambattur(Uzhavar Sandhai)", value: "Ambattur(Uzhavar Sandhai)" },
        { label: "Thiruvellore", value: "Thiruvellore" },
        { label: "Arakkonam", value: "Arakkonam" }
      ]},
      { label: "Salem", value: "Salem", markets: [
        { label: "Ammapet(Uzhavar Sandhai)", value: "Ammapet(Uzhavar Sandhai)" },
        { label: "Salem", value: "Salem" },
        { label: "Attur", value: "Attur" }
      ]},
      { label: "Theni", value: "Theni", markets: [
        { label: "Andipatti(Uzhavar Sandhai)", value: "Andipatti(Uzhavar Sandhai)" },
        { label: "Theni", value: "Theni" },
        { label: "Bodinayakkanur", value: "Bodinayakkanur" }
      ]},
      { label: "Thiruvannamalai", value: "Thiruvannamalai", markets: [
        { label: "Arani(Uzhavar Sandhai)", value: "Arani(Uzhavar Sandhai)" },
        { label: "Thiruvannamalai", value: "Thiruvannamalai" },
        { label: "Chengam", value: "Chengam" }
      ]},
      { label: "Ranipet", value: "Ranipet", markets: [
        { label: "Arcot(Uzhavar Sandhai)", value: "Arcot(Uzhavar Sandhai)" },
        { label: "Ranipet", value: "Ranipet" },
        { label: "Arakkonam", value: "Arakkonam" }
      ]},
      { label: "Ariyalur", value: "Ariyalur", markets: [
        { label: "Ariyalur(Uzhavar Sandhai)", value: "Ariyalur(Uzhavar Sandhai)" },
        { label: "Ariyalur", value: "Ariyalur" },
        { label: "Udayarpalayam", value: "Udayarpalayam" }
      ]},
      { label: "Virudhunagar", value: "Virudhunagar", markets: [
        { label: "Aruppukottai(Uzhavar Sandhai)", value: "Aruppukottai(Uzhavar Sandhai)" },
        { label: "Virudhunagar", value: "Virudhunagar" },
        { label: "Sivakasi", value: "Sivakasi" }
      ]}
    ]
  },
  {
    label: "Uttar Pradesh",
    value: "Uttar Pradesh",
    districts: [
      { label: "Lucknow", value: "Lucknow", markets: [
        { label: "Lucknow (Naveen Galla Mandi)", value: "Lucknow (Naveen Galla Mandi)" },
        { label: "Chowk", value: "Chowk" },
        { label: "Aminabad", value: "Aminabad" }
      ]},
      { label: "Kanpur", value: "Kanpur", markets: [
        { label: "Kanpur (Chakeri Mandi)", value: "Kanpur (Chakeri Mandi)" },
        { label: "Panki", value: "Panki" },
        { label: "Kalyanpur", value: "Kalyanpur" }
      ]},
      { label: "Varanasi", value: "Varanasi", markets: [
        { label: "Varanasi (Paharia Mandi)", value: "Varanasi (Paharia Mandi)" },
        { label: "Godowlia", value: "Godowlia" },
        { label: "Lanka", value: "Lanka" }
      ]},
      { label: "Agra", value: "Agra", markets: [
        { label: "Agra", value: "Agra" },
        { label: "Fatehpur Sikri", value: "Fatehpur Sikri" },
        { label: "Sikandra", value: "Sikandra" }
      ]},
      { label: "Auraiya", value: "Auraiya", markets: [
        { label: "Achalda", value: "Achalda" },
        { label: "Auraiya", value: "Auraiya" },
        { label: "Bidhuna", value: "Bidhuna" }
      ]},
      { label: "Mirzapur", value: "Mirzapur", markets: [
        { label: "Ahirora", value: "Ahirora" },
        { label: "Mirzapur", value: "Mirzapur" },
        { label: "Chunar", value: "Chunar" }
      ]},
      { label: "Prayagraj", value: "Prayagraj", markets: [
        { label: "Ajuha", value: "Ajuha" },
        { label: "Allahabad", value: "Allahabad" },
        { label: "Koraon", value: "Koraon" }
      ]},
      { label: "Ambedkarnagar", value: "Ambedkarnagar", markets: [
        { label: "Akbarpur", value: "Akbarpur" },
        { label: "Ambedkarnagar", value: "Ambedkarnagar" },
        { label: "Jalalpur", value: "Jalalpur" }
      ]},
      { label: "Aligarh", value: "Aligarh", markets: [
        { label: "Aligarh", value: "Aligarh" },
        { label: "Khair", value: "Khair" },
        { label: "Iglas", value: "Iglas" }
      ]},
      { label: "Amroha", value: "Amroha", markets: [
        { label: "Amroha", value: "Amroha" },
        { label: "Dhanaura", value: "Dhanaura" },
        { label: "Hasanpur", value: "Hasanpur" }
      ]},
      { label: "Bulandshahar", value: "Bulandshahar", markets: [
        { label: "Anoop Shahar", value: "Anoop Shahar" },
        { label: "Bulandshahar", value: "Bulandshahar" },
        { label: "Khurja", value: "Khurja" }
      ]},
      { label: "Bareilly", value: "Bareilly", markets: [
        { label: "Anwala", value: "Anwala" },
        { label: "Bareilly", value: "Bareilly" },
        { label: "Aonla", value: "Aonla" }
      ]},
      { label: "Maharajganj", value: "Maharajganj", markets: [
        { label: "Anandnagar", value: "Anandnagar" },
        { label: "Maharajganj", value: "Maharajganj" },
        { label: "Nautanwa", value: "Nautanwa" }
      ]}
    ]
  },
  {
    label: "West Bengal",
    value: "West Bengal",
    districts: [
      { label: "Kolkata", value: "Kolkata", markets: [
        { label: "Koley Market", value: "Koley Market" },
        { label: "Posta Bazar", value: "Posta Bazar" },
        { label: "New Market", value: "New Market" },
        { label: "Gariahat", value: "Gariahat" }
      ]},
      { label: "North 24 Parganas", value: "North 24 Parganas", markets: [
        { label: "Barasat", value: "Barasat" },
        { label: "Basirhat", value: "Basirhat" },
        { label: "Bangaon", value: "Bangaon" }
      ]},
      { label: "Hooghly", value: "Hooghly", markets: [
        { label: "Sheoraphuli", value: "Sheoraphuli" },
        { label: "Chinsurah", value: "Chinsurah" },
        { label: "Serampore", value: "Serampore" }
      ]},
      { label: "Malda", value: "Malda", markets: [
        { label: "Malda", value: "Malda" },
        { label: "English Bazar", value: "English Bazar" },
        { label: "Chanchal", value: "Chanchal" }
      ]},
      { label: "Alipurduar", value: "Alipurduar", markets: [
        { label: "Alipurduar", value: "Alipurduar" },
        { label: "Falakata", value: "Falakata" },
        { label: "Madarihat", value: "Madarihat" }
      ]},
      { label: "Paschim Bardhaman", value: "Paschim Bardhaman", markets: [
        { label: "Asansol", value: "Asansol" },
        { label: "Durgapur", value: "Durgapur" },
        { label: "Kulti", value: "Kulti" }
      ]}
    ]
  },
  {
    label: "Bihar",
    value: "Bihar",
    districts: [
      { label: "Patna", value: "Patna", markets: [
        { label: "Patna", value: "Patna" },
        { label: "Danapur", value: "Danapur" },
        { label: "Phulwari Sharif", value: "Phulwari Sharif" }
      ]},
      { label: "Muzaffarpur", value: "Muzaffarpur", markets: [
        { label: "Muzaffarpur", value: "Muzaffarpur" },
        { label: "Motihari", value: "Motihari" },
        { label: "Sitamarhi", value: "Sitamarhi" }
      ]},
      { label: "Gaya", value: "Gaya", markets: [
        { label: "Gaya", value: "Gaya" },
        { label: "Bodh Gaya", value: "Bodh Gaya" },
        { label: "Tekari", value: "Tekari" }
      ]}
    ]
  },
  {
    label: "Haryana",
    value: "Haryana",
    districts: [
      { label: "Gurugram", value: "Gurugram", markets: [
        { label: "Gurugram", value: "Gurugram" },
        { label: "Faridabad", value: "Faridabad" },
        { label: "Manesar", value: "Manesar" }
      ]},
      { label: "Hisar", value: "Hisar", markets: [
        { label: "Hisar", value: "Hisar" },
        { label: "Bhiwani", value: "Bhiwani" },
        { label: "Fatehabad", value: "Fatehabad" }
      ]},
      { label: "Karnal", value: "Karnal", markets: [
        { label: "Karnal", value: "Karnal" },
        { label: "Panipat", value: "Panipat" },
        { label: "Kurukshetra", value: "Kurukshetra" }
      ]}
    ]
  },
  {
    label: "Delhi",
    value: "Delhi",
    districts: [
      { label: "New Delhi", value: "New Delhi", markets: [
        { label: "Azadpur Mandi", value: "Azadpur Mandi" },
        { label: "Okhla Mandi", value: "Okhla Mandi" },
        { label: "Ghazipur Mandi", value: "Ghazipur Mandi" }
      ]},
      { label: "Central Delhi", value: "Central Delhi", markets: [
        { label: "Chandni Chowk", value: "Chandni Chowk" },
        { label: "Karol Bagh", value: "Karol Bagh" }
      ]},
      { label: "East Delhi", value: "East Delhi", markets: [
        { label: "Seelampur", value: "Seelampur" },
        { label: "Shastri Nagar", value: "Shastri Nagar" }
      ]}
    ]
  }
];

export const flattenedMarketLabels: string[] = marketOptions.flatMap(state =>
  state.districts.flatMap(d =>
    d.markets.map(m => `${state.label}: ${d.label} — ${m.label}`)
  )
);