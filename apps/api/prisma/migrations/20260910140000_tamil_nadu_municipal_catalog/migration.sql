-- Tamil Nadu municipal cities and towns, grouped under their districts.
-- Source: https://en.wikipedia.org/wiki/List_of_urban_local_bodies_in_Tamil_Nadu
-- Municipal corporation and municipality tables retrieved 2026-09-10.
-- Scope: listed corporations/municipalities, not all villages or town panchayats.
-- New coordinates intentionally remain NULL; existing location IDs are preserved.
DO $migration$
DECLARE
  state_id uuid;
  district_id uuid;
  city_id uuid;
  district_record jsonb;
  city_name text;
  district_slug text;
  city_slug text;
BEGIN
  SELECT id INTO STRICT state_id FROM locations WHERE slug = 'tamil-nadu' AND type = 'STATE';
  FOR district_record IN SELECT value FROM jsonb_array_elements($catalog$
[
  {
    "district": "Chennai",
    "cities": [
      "Chennai"
    ]
  },
  {
    "district": "Madurai",
    "cities": [
      "Madurai",
      "Melur",
      "Thirumangalam",
      "Usilampatti"
    ]
  },
  {
    "district": "Coimbatore",
    "cities": [
      "Coimbatore",
      "Mettupalayam",
      "Karamadai",
      "Gudalur",
      "Karumathampatti",
      "Sulur",
      "Pollachi",
      "Valparai"
    ]
  },
  {
    "district": "Tiruchirappalli",
    "cities": [
      "Tiruchirappalli",
      "Manapparai",
      "Musiri",
      "Lalgudi",
      "Thuraiyur",
      "Thuvakudi"
    ]
  },
  {
    "district": "Salem",
    "cities": [
      "Salem",
      "Attur",
      "Edaganasalai",
      "Edappadi",
      "Mettur",
      "Narasingapuram",
      "Sangagiri",
      "Tharamangalam"
    ]
  },
  {
    "district": "Tirunelveli",
    "cities": [
      "Tirunelveli",
      "Ambasamudram",
      "Kalakkad",
      "Vadakkuvalliyur",
      "Vikramasingapuram"
    ]
  },
  {
    "district": "Vellore",
    "cities": [
      "Vellore",
      "Gudiyatham",
      "Pernambut"
    ]
  },
  {
    "district": "Tiruppur",
    "cities": [
      "Tiruppur",
      "Avinashi",
      "Dharapuram",
      "Kangeyam",
      "Palladam",
      "Thirumuruganpoondi",
      "Udumalaipettai",
      "Vellakoil"
    ]
  },
  {
    "district": "Erode",
    "cities": [
      "Erode",
      "Bhavani",
      "Gobichettipalayam",
      "Kavandapadi",
      "Perundurai",
      "Punjai Puliampatti",
      "Sathyamangalam"
    ]
  },
  {
    "district": "Thoothukudi",
    "cities": [
      "Thoothukudi",
      "Kayalpatnam",
      "Kovilpatti",
      "Tiruchendur"
    ]
  },
  {
    "district": "Dindigul",
    "cities": [
      "Dindigul",
      "Kodaikanal",
      "Oddanchatram",
      "Palani"
    ]
  },
  {
    "district": "Thanjavur",
    "cities": [
      "Thanjavur",
      "Kumbakonam",
      "Adirampattinam",
      "Pattukkottai",
      "Thiruvaiyaru"
    ]
  },
  {
    "district": "Kanyakumari",
    "cities": [
      "Nagercoil",
      "Padmanabhapuram",
      "Kuzhithurai",
      "Colachel",
      "Kollankodu",
      "Kanyakumari"
    ]
  },
  {
    "district": "Krishnagiri",
    "cities": [
      "Hosur",
      "Krishnagiri"
    ]
  },
  {
    "district": "Tiruvallur",
    "cities": [
      "Avadi",
      "Tiruvallur",
      "Tiruttani",
      "Ponneri",
      "Naravarikuppam",
      "Veppampattu"
    ]
  },
  {
    "district": "Cuddalore",
    "cities": [
      "Cuddalore",
      "Chidambaram",
      "Panruti",
      "Nellikuppam",
      "Tittakudi",
      "Vadalur",
      "Virudhachalam"
    ]
  },
  {
    "district": "Kancheepuram",
    "cities": [
      "Kancheepuram",
      "Kundrathur",
      "Mangadu",
      "Sriperumbudur"
    ]
  },
  {
    "district": "Karur",
    "cities": [
      "Karur",
      "Kulithalai",
      "Pallapatti",
      "Pugalur"
    ]
  },
  {
    "district": "Virudhunagar",
    "cities": [
      "Sivakasi",
      "Aruppukkottai",
      "Rajapalayam",
      "Sattur",
      "Srivilliputhur",
      "Virudhunagar"
    ]
  },
  {
    "district": "Chengalpattu",
    "cities": [
      "Tambaram",
      "Chengalpattu",
      "Maduranthakam",
      "Mamallapuram",
      "Maraimalai Nagar",
      "Nandivaram-Guduvancheri"
    ]
  },
  {
    "district": "Sivaganga",
    "cities": [
      "Karaikudi",
      "Devakottai",
      "Manamadurai",
      "Sivaganga"
    ]
  },
  {
    "district": "Namakkal",
    "cities": [
      "Namakkal",
      "Komarapalayam",
      "Mohanur",
      "Pallipalayam",
      "Rasipuram",
      "Tiruchengode"
    ]
  },
  {
    "district": "Pudukkottai",
    "cities": [
      "Pudukkottai",
      "Aranthangi"
    ]
  },
  {
    "district": "Tiruvannamalai",
    "cities": [
      "Tiruvannamalai",
      "Arni",
      "Chengam",
      "Polur",
      "Thiruvathipuram",
      "Vandavasi"
    ]
  },
  {
    "district": "Viluppuram",
    "cities": [
      "Kottakuppam",
      "Tindivanam",
      "Viluppuram"
    ]
  },
  {
    "district": "Kallakurichi",
    "cities": [
      "Kallakurichi",
      "Tirukoilur",
      "Ulundurpettai"
    ]
  },
  {
    "district": "Ranipet",
    "cities": [
      "Arakkonam",
      "Arcot",
      "Melvisharam",
      "Ranipet",
      "Sholinghur",
      "Walajapet"
    ]
  },
  {
    "district": "Tirupathur",
    "cities": [
      "Ambur",
      "Jolarpettai",
      "Tirupattur",
      "Vaniyambadi"
    ]
  },
  {
    "district": "Dharmapuri",
    "cities": [
      "Dharmapuri",
      "Harur"
    ]
  },
  {
    "district": "Nilgiris",
    "cities": [
      "Coonoor",
      "Gudalur",
      "Kotagiri",
      "Nelliyalam",
      "Udagamandalam"
    ]
  },
  {
    "district": "Nagapattinam",
    "cities": [
      "Nagapattinam",
      "Vedaranyam"
    ]
  },
  {
    "district": "Mayiladuthurai",
    "cities": [
      "Mayiladuthurai",
      "Sirkazhi"
    ]
  },
  {
    "district": "Ariyalur",
    "cities": [
      "Ariyalur",
      "Jayankondam"
    ]
  },
  {
    "district": "Perambalur",
    "cities": [
      "Perambalur"
    ]
  },
  {
    "district": "Thiruvarur",
    "cities": [
      "Koothanallur",
      "Mannargudi",
      "Thiruthuraipoondi",
      "Thiruvarur"
    ]
  },
  {
    "district": "Theni",
    "cities": [
      "Bodinayakkanur",
      "Chinnamanur",
      "Cumbum",
      "Gudalur",
      "Periyakulam",
      "Theni Allinagaram",
      "Uthamapalayam"
    ]
  },
  {
    "district": "Ramanathapuram",
    "cities": [
      "Kilakarai",
      "Paramakudi",
      "Ramanathapuram",
      "Rameswaram"
    ]
  },
  {
    "district": "Tenkasi",
    "cities": [
      "Kadayanallur",
      "Puliyankudi",
      "Sankarankovil",
      "Sengottai",
      "Surandai",
      "Tenkasi"
    ]
  }
]
$catalog$::jsonb)
  LOOP
    district_slug := lower(replace(district_record->>'district', ' ', '-')) || '-district';
    SELECT id INTO district_id FROM locations WHERE parent_id = state_id AND type = 'DISTRICT' AND slug = district_slug;
    IF district_id IS NULL THEN
      INSERT INTO locations(parent_id,type,name,slug,country_code,timezone)
      VALUES(state_id,'DISTRICT',(district_record->>'district') || ' District',district_slug,'IN','Asia/Kolkata')
      RETURNING id INTO district_id;
    END IF;
    FOR city_name IN SELECT jsonb_array_elements_text(district_record->'cities')
    LOOP
      SELECT id INTO city_id FROM locations WHERE parent_id = district_id AND type = 'CITY' AND name = city_name;
      IF city_id IS NULL THEN
        -- District-qualified slugs avoid collisions such as the three Gudalurs.
        city_slug := lower(replace(city_name,' ','-')) || '-' || lower(replace(district_record->>'district',' ','-')) || '-tn';
        INSERT INTO locations(parent_id,type,name,slug,country_code,timezone)
        VALUES(district_id,'CITY',city_name,city_slug,'IN','Asia/Kolkata');
      END IF;
    END LOOP;
  END LOOP;
END $migration$;
