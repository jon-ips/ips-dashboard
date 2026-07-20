// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE 2026 REYKJAVÍK SEASON — CORRECTED DOKK DATA
// ═══════════════════════════════════════════════════════════════════════════════
export const SHIPS = [
  // ─── MAY ────────────────────────────────────────────────────────────────────
  { date: "2026-05-04", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-08", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-10", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-13", endDate: "2026-05-14", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-14", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: false, pax: 530, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-15", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-18", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-19", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other", berth: "Miðbakki" },
  { date: "2026-05-20", endDate: "2026-05-21", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-21", endDate: null, line: "Hapag-Lloyd", ship: "Europa 2", turnaround: false, pax: 706, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-22", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: false, pax: 530, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-05-23", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-23", endDate: "2026-05-24", line: "Hapag-Lloyd", ship: "Europa 2", turnaround: false, pax: 706, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-25", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other", berth: "Miðbakki" },
  { date: "2026-05-26", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other", berth: "Miðbakki" },
  { date: "2026-05-27", endDate: null, line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-05-27", endDate: "2026-05-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other", berth: "Skarfabakki" },
  { date: "2026-05-28", endDate: "2026-05-29", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-05-28", endDate: "2026-05-30", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-05-29", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: false, pax: 530, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-05-29", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other", berth: "Faxagarður" },
  { date: "2026-05-29", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other", berth: "Miðbakki" },
  { date: "2026-05-31", endDate: null, line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  // ─── JUNE ───────────────────────────────────────────────────────────────────
  { date: "2026-06-02", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: false, pax: 160, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-02", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other", berth: "Miðbakki" },
  { date: "2026-06-02", endDate: null, line: "Peace Boat", ship: "Pacific World", turnaround: false, pax: 1950, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-03", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other", berth: "Miðbakki" },
  { date: "2026-06-04", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: false, pax: 604, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-05", endDate: null, line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-06", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-07", endDate: "2026-06-08", line: "Celebrity", ship: "Celebrity Eclipse", turnaround: false, pax: 2852, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-07", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other", berth: "Miðbakki" },
  { date: "2026-06-08", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-08", endDate: "2026-06-09", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-08", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "other", berth: "Korngarður" },
  { date: "2026-06-08", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-06-09", endDate: null, line: "Celebrity", ship: "Celebrity Eclipse", turnaround: false, pax: 2852, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-10", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-10", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-10", endDate: "2026-06-11", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-10", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Miðbakki" },
  { date: "2026-06-11", endDate: "2026-06-12", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-11", endDate: null, line: "MSC", ship: "MSC Virtuosa", turnaround: false, pax: 6297, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-12", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: false, pax: 2106, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-13", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-13", endDate: "2026-06-14", line: "MSC", ship: "MSC Virtuosa", turnaround: false, pax: 6297, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-14", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-14", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other", berth: "Miðbakki" },
  { date: "2026-06-15", endDate: "2026-06-16", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-15", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Miðbakki" },
  { date: "2026-06-16", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "other", berth: "Miðbakki" },
  { date: "2026-06-17", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-17", endDate: "2026-06-18", line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-17", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-06-18", endDate: "2026-06-19", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-18", endDate: null, line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-18", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: false, pax: 228, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-18", endDate: "2026-06-19", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-18", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other", berth: "Miðbakki" },
  { date: "2026-06-19", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: false, pax: 200, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-20", endDate: null, line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-20", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-21", endDate: null, line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-21", endDate: "2026-06-22", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-21", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other", berth: "Miðbakki" },
  { date: "2026-06-21", endDate: "2026-06-23", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-22", endDate: null, line: "P&O", ship: "Aurora", turnaround: false, pax: 1868, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-23", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-23", endDate: null, line: "Princess Cruises", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-24", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-24", endDate: null, line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-24", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-24", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-06-25", endDate: "2026-06-26", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-06-25", endDate: null, line: "Princess Cruises", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-25", endDate: null, line: "Nicko Cruises", ship: "Vasco da Gama", turnaround: false, pax: 1258, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-06-25", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-25", endDate: "2026-06-26", line: "P&O", ship: "Aurora", turnaround: false, pax: 1868, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-25", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other", berth: "Miðbakki" },
  { date: "2026-06-25", endDate: "2026-06-27", line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-25", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-26", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: false, pax: 228, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-26", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other", berth: "Korngarður" },
  { date: "2026-06-26", endDate: null, line: "National Geographic", ship: "National Geographic Resolution", turnaround: true, pax: 126, status: "other", berth: "Miðbakki" },
  { date: "2026-06-28", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-28", endDate: null, line: "Quark Expeditions", ship: "Ocean Nova", turnaround: true, pax: 68, status: "other", berth: "Miðbakki" },
  { date: "2026-06-29", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-06-29", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: false, pax: 990, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-06-29", endDate: "2026-07-01", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other", berth: "Skarfabakki" },
  { date: "2026-06-29", endDate: "2026-07-01", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-06-30", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  // ─── JULY ───────────────────────────────────────────────────────────────────
  { date: "2026-07-01", endDate: null, line: "Fred Olsen", ship: "Borealis", turnaround: false, pax: 1360, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-01", endDate: null, line: "Holland America", ship: "Volendam", turnaround: false, pax: 1432, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-01", endDate: "2026-07-02", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-01", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other", berth: "Miðbakki" },
  { date: "2026-07-02", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-02", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-02", endDate: "2026-07-03", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-02", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-02", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: false, pax: 230, status: "other", berth: "Miðbakki" },
  { date: "2026-07-03", endDate: null, line: "Fred Olsen", ship: "Borealis", turnaround: false, pax: 1404, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-03", endDate: null, line: "Carnival", ship: "Carnival Legend", turnaround: false, pax: 2124, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-03", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-07-04", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-04", endDate: null, line: "Princess Cruises", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-04", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-04", endDate: null, line: "Saga", ship: "Spirit of Discovery", turnaround: false, pax: 999, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-05", endDate: null, line: "Carnival", ship: "Carnival Legend", turnaround: false, pax: 2124, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-05", endDate: null, line: "National Geographic", ship: "National Geographic Resolution", turnaround: true, pax: 126, status: "other", berth: "Miðbakki" },
  { date: "2026-07-05", endDate: "2026-07-06", line: "Holland America", ship: "Volendam", turnaround: false, pax: 1432, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-06", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: false, pax: 228, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-06", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-07-06", endDate: "2026-07-07", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-07", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-07", endDate: null, line: "Saga", ship: "Spirit of Discovery", turnaround: false, pax: 999, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-07", endDate: null, line: "Princess Cruises", ship: "Sky Princess", turnaround: false, pax: 3660, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-08", endDate: null, line: "P&O", ship: "Britannia", turnaround: false, pax: 3647, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-08", endDate: null, line: "Princess Cruises", ship: "Crown Princess", turnaround: false, pax: 3090, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-09", endDate: "2026-07-10", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-09", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-09", endDate: "2026-07-10", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other", berth: "Korngarður" },
  { date: "2026-07-09", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-09", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "P&O", ship: "Britannia", turnaround: false, pax: 3647, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-10", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-10", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-07-11", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-11", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other", berth: "Faxagarður" },
  { date: "2026-07-11", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other", berth: "Miðbakki" },
  { date: "2026-07-11", endDate: "2026-07-12", line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 744, status: "other", berth: "Korngarður" },
  { date: "2026-07-12", endDate: null, line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-12", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-12", endDate: null, line: "Oceania", ship: "Insignia", turnaround: false, pax: 684, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-07-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-13", endDate: null, line: "TUI", ship: "Mein Schiff 3", turnaround: false, pax: 2506, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-13", endDate: null, line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-13", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-07-13", endDate: "2026-07-14", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-14", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-14", endDate: "2026-07-15", line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-14", endDate: null, line: "Regent", ship: "Seven Seas Mariner", turnaround: false, pax: 700, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-07-14", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-14", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 670, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-14", endDate: null, line: "National Geographic", ship: "National Geographic Resolution", turnaround: true, pax: 126, status: "other", berth: "Faxagarður" },
  { date: "2026-07-14", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other", berth: "Miðbakki" },
  { date: "2026-07-15", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-15", endDate: null, line: "TUI", ship: "Mein Schiff 3", turnaround: false, pax: 2506, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-16", endDate: "2026-07-17", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-16", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-16", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "other", berth: "Miðbakki" },
  { date: "2026-07-16", endDate: "2026-07-17", line: "Regent", ship: "Seven Seas Mariner", turnaround: true, pax: 700, status: "other", berth: "Korngarður" },
  { date: "2026-07-17", endDate: null, line: "Oceania", ship: "Insignia", turnaround: false, pax: 684, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-17", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: false, pax: 2106, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-17", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-07-17", endDate: "2026-07-18", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-17", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-18", endDate: null, line: "Ponant", ship: "L'Austral", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-18", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-07-18", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-19", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: false, pax: 809, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-19", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-19", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-07-19", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-20", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-20", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-07-20", endDate: "2026-07-21", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-20", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-21", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-22", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 744, status: "other", berth: "Korngarður" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Oceania", ship: "Vista", turnaround: true, pax: 1200, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-23", endDate: "2026-07-24", line: "Ponant", ship: "Le Bellot", turnaround: false, pax: null, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-23", endDate: null, line: "Phoenix Reisen", ship: "Renaissance", turnaround: false, pax: 694, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-23", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-23", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Miðbakki" },
  { date: "2026-07-24", endDate: "2026-07-25", line: "Ponant", ship: "Le Lapérouse", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-24", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-24", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: false, pax: 998, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-24", endDate: "2026-07-25", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-24", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 670, status: "other", berth: "Korngarður" },
  { date: "2026-07-25", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-25", endDate: null, line: "Phoenix Reisen", ship: "Renaissance", turnaround: false, pax: 1258, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-26", endDate: null, line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-26", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-26", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "other", berth: "Miðbakki" },
  { date: "2026-07-26", endDate: "2026-07-28", line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other", berth: "Faxagarður" },
  { date: "2026-07-27", endDate: "2026-07-29", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", berth: "Skarfabakki" },
  { date: "2026-07-27", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Korngarður" },
  { date: "2026-07-27", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-07-27", endDate: "2026-07-28", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-28", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-29", endDate: "2026-07-30", line: "Holland America", ship: "Zuiderdam", turnaround: false, pax: 2272, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-07-30", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-30", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-30", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 199, status: "other", berth: "Faxagarður" },
  { date: "2026-07-30", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other", berth: "Miðbakki" },
  { date: "2026-07-31", endDate: null, line: "Oceania", ship: "Insignia", turnaround: false, pax: 684, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-07-31", endDate: null, line: "Ponant", ship: "Le Lapérouse", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-07-31", endDate: null, line: "Cunard", ship: "Queen Anne", turnaround: false, pax: 2650, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-07-31", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-07-31", endDate: "2026-08-01", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  // ─── AUGUST ─────────────────────────────────────────────────────────────────
  { date: "2026-08-01", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 744, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-02", endDate: null, line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-02", endDate: null, line: "Holland America", ship: "Nieuw Statendam", turnaround: false, pax: 2650, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-02", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: false, pax: 186, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-02", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Miðbakki" },
  { date: "2026-08-02", endDate: "2026-08-03", line: "Cunard", ship: "Queen Anne", turnaround: false, pax: 2650, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-03", endDate: null, line: "Viking", ship: "Viking Saturn", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Oceania", ship: "Insignia", turnaround: true, pax: 670, status: "other", berth: "Korngarður" },
  { date: "2026-08-03", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-04", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-04", endDate: "2026-08-05", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-04", endDate: null, line: "SunStone Ships", ship: "Ocean Explorer", turnaround: true, pax: 160, status: "other", berth: "Miðbakki" },
  { date: "2026-08-05", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-08-05", endDate: "2026-08-07", line: "Viking", ship: "Viking Saturn", turnaround: true, pax: 930, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-06", endDate: "2026-08-07", line: "Phoenix Reisen", ship: "Deutschland", turnaround: false, pax: 520, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-06", endDate: null, line: "TUI", ship: "Mein Schiff 7", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-06", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-06", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 199, status: "other", berth: "Miðbakki" },
  { date: "2026-08-07", endDate: null, line: "Ponant", ship: "Le Lapérouse", turnaround: false, pax: 264, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-07", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-07", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-07", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "TUI", ship: "Mein Schiff 7", turnaround: false, pax: 2894, status: "other", berth: "Kleppsbakki" },
  { date: "2026-08-08", endDate: null, line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-08", endDate: null, line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-08", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Miðbakki" },
  { date: "2026-08-08", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 200, status: "other", berth: "Faxagarður" },
  { date: "2026-08-09", endDate: null, line: "Noble Caledonia", ship: "Hebridean Sky", turnaround: false, pax: 118, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-09", endDate: null, line: "Viking", ship: "Viking Saturn", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-09", endDate: "2026-08-10", line: "P&O", ship: "Arcadia", turnaround: false, pax: 1994, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-09", endDate: null, line: "National Geographic", ship: "National Geographic Explorer", turnaround: true, pax: 148, status: "other", berth: "Korngarður" },
  { date: "2026-08-09", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other", berth: "Miðbakki" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other", berth: "Faxagarður" },
  { date: "2026-08-10", endDate: null, line: "Aida", ship: "AIDAbella", turnaround: false, pax: 2050, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-10", endDate: null, line: "Oceania", ship: "Marina", turnaround: false, pax: 1285, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-10", endDate: "2026-08-11", line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other", berth: "Korngarður" },
  { date: "2026-08-10", endDate: null, line: "Albatros Expeditions", ship: "Ocean Albatros", turnaround: true, pax: 186, status: "other", berth: "Faxagarður" },
  { date: "2026-08-10", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-08-10", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-11", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-11", endDate: null, line: "Ritz-Carlton", ship: "Evrima", turnaround: false, pax: 298, status: "other", port: "AK", berth: "Krossanes 1a" },
  { date: "2026-08-11", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Aida", ship: "AIDAbella", turnaround: false, pax: 2050, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-11", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Plantours", ship: "Hamburg", turnaround: false, pax: 408, status: "other", berth: "Miðbakki" },
  { date: "2026-08-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other", berth: "Faxagarður" },
  { date: "2026-08-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", berth: "Korngarður" },
  { date: "2026-08-12", endDate: "2026-08-13", line: "Cunard", ship: "Queen Mary 2", turnaround: false, pax: 2691, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-13", endDate: null, line: "P&O", ship: "Arcadia", turnaround: false, pax: 1994, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-13", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: false, pax: 998, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-13", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1250, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-14", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-14", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Scenic", ship: "Scenic Eclipse", turnaround: false, pax: 228, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-14", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-08-14", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "other", berth: "Korngarður" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-14", endDate: null, line: "Holland America", ship: "Nieuw Statendam", turnaround: false, pax: 2650, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other", berth: "Korngarður" },
  { date: "2026-08-15", endDate: null, line: "Oceanwide Expeditions", ship: "Hondius", turnaround: false, pax: 196, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-15", endDate: null, line: "Oceania", ship: "Marina", turnaround: false, pax: 1285, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-15", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "other", berth: "Miðbakki" },
  { date: "2026-08-15", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other", berth: "Faxagarður" },
  { date: "2026-08-15", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: false, pax: 2762, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-16", endDate: null, line: "Ritz-Carlton", ship: "Evrima", turnaround: false, pax: 298, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-16", endDate: null, line: "Oceanwide Expeditions", ship: "Plancius", turnaround: false, pax: 116, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-08-16", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other", berth: "Faxagarður" },
  { date: "2026-08-16", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-08-16", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-16", endDate: "2026-08-17", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-17", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other", berth: "Faxagarður" },
  { date: "2026-08-17", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-08-17", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-18", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-18", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-18", endDate: null, line: "Ritz-Carlton", ship: "Evrima", turnaround: true, pax: 298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-18", endDate: "2026-08-20", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-18", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other", berth: "Miðbakki" },
  { date: "2026-08-18", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other", berth: "Faxagarður" },
  { date: "2026-08-19", endDate: null, line: "Noble Caledonia", ship: "Hebridean Sky", turnaround: false, pax: 118, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-19", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other", berth: "Miðbakki" },
  { date: "2026-08-19", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Faxagarður" },
  { date: "2026-08-20", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: false, pax: 2106, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-20", endDate: null, line: "Regent", ship: "Seven Seas Voyager", turnaround: true, pax: 689, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-20", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other", berth: "Miðbakki" },
  { date: "2026-08-21", endDate: null, line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-21", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-08-21", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: false, pax: 930, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-21", endDate: "2026-08-22", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-22", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-23", endDate: null, line: "Regent", ship: "Seven Seas Voyager", turnaround: false, pax: 700, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-23", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1250, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-23", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-24", endDate: "2026-08-25", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: false, pax: 2886, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-24", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: false, pax: 604, status: "contracted", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-24", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-24", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  { date: "2026-08-25", endDate: null, line: "Oceanwide Expeditions", ship: "Plancius", turnaround: false, pax: 116, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-08-26", endDate: null, line: "Phoenix Reisen", ship: "Amera", turnaround: false, pax: 835, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-27", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-27", endDate: "2026-08-28", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-27", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-08-28", endDate: null, line: "TUI", ship: "Mein Schiff 1", turnaround: false, pax: 2894, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-08-28", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: false, pax: 212, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-08-28", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: false, pax: 990, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-29", endDate: null, line: "Aida", ship: "AIDAdiva", turnaround: false, pax: 1025, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-29", endDate: "2026-08-30", line: "TUI", ship: "Mein Schiff 1", turnaround: false, pax: 2894, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-30", endDate: null, line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-30", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other", berth: "Miðbakki" },
  { date: "2026-08-30", endDate: "2026-09-01", line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-08-31", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-08-31", endDate: "2026-09-01", line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other", berth: "Skarfabakki" },
  { date: "2026-08-31", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other", berth: "Faxagarður" },
  { date: "2026-08-31", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other", berth: "Miðbakki" },
  // ─── SEPTEMBER ──────────────────────────────────────────────────────────────
  { date: "2026-09-01", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other", berth: "Miðbakki" },
  { date: "2026-09-02", endDate: "2026-09-03", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-03", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: false, pax: 990, status: "contracted", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-03", endDate: null, line: "Princess Cruises", ship: "Sky Princess", turnaround: false, pax: 3660, status: "other", berth: "Skarfabakki" },
  { date: "2026-09-04", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: false, pax: 2770, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-05", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-05", endDate: null, line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 254, status: "other", berth: "Miðbakki" },
  { date: "2026-09-06", endDate: null, line: "Princess Cruises", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-06", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: true, pax: 2762, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-07", endDate: "2026-09-08", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-07", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-09-08", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other", berth: "Faxagarður" },
  { date: "2026-09-08", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other", berth: "Miðbakki" },
  { date: "2026-09-09", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other", berth: "Miðbakki" },
  { date: "2026-09-10", endDate: "2026-09-12", line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-11", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other", berth: "Miðbakki" },
  { date: "2026-09-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other", berth: "Faxagarður" },
  { date: "2026-09-15", endDate: null, line: "Explora Journeys", ship: "Explora 3", turnaround: false, pax: 962, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-15", endDate: null, line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-15", endDate: null, line: "Plantours", ship: "Hamburg", turnaround: false, pax: 408, status: "other", berth: "Miðbakki" },
  { date: "2026-09-16", endDate: "2026-09-17", line: "Explora Journeys", ship: "Explora 3", turnaround: true, pax: 962, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-17", endDate: null, line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-17", endDate: null, line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other", port: "AK", berth: "Oddeyrarbryggja 12" },
  { date: "2026-09-17", endDate: null, line: "Oceanwide Expeditions", ship: "Ortelius", turnaround: false, pax: 116, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-09-17", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other", berth: "Miðbakki" },
  { date: "2026-09-18", endDate: null, line: "National Geographic", ship: "National Geographic Endurance", turnaround: true, pax: 170, status: "other", berth: "Miðbakki" },
  { date: "2026-09-18", endDate: "2026-09-19", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2298, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-19", endDate: null, line: "Oceanwide Expeditions", ship: "Hondius", turnaround: false, pax: 196, status: "other", port: "AK", berth: "Tangabryggja 11b" },
  { date: "2026-09-19", endDate: "2026-09-20", line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 254, status: "other", berth: "Skarfabakki" },
  { date: "2026-09-19", endDate: "2026-09-20", line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 120, status: "other", berth: "Faxagarður" },
  { date: "2026-09-20", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other", berth: "Miðbakki" },
  { date: "2026-09-21", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other", port: "AK", berth: "Tangabryggja 11a" },
  { date: "2026-09-21", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other", berth: "Skarfabakki" },
  { date: "2026-09-21", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 200, status: "other", berth: "Miðbakki" },
  { date: "2026-09-23", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other", berth: "Miðbakki" },
  { date: "2026-09-24", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: true, pax: 230, status: "other", berth: "Miðbakki" },
  { date: "2026-09-26", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: false, pax: 335, status: "other", port: "AK", berth: "Torfunef" },
  { date: "2026-09-26", endDate: null, line: "Princess Cruises", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-26", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other", berth: "Miðbakki" },
  { date: "2026-09-27", endDate: "2026-09-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other", berth: "VÖR Cruise Terminal" },
  { date: "2026-09-27", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other", berth: "Miðbakki" },
]

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export const SIMPLE_TURNAROUND_WEIGHT = 3;
export const TRANSIT_WEIGHT = 1;

export const getTieredWeight = (ship) => {
  if (!ship.turnaround) return TRANSIT_WEIGHT;
  if (ship.pax < 300) return 1;
  if (ship.pax <= 600) return 3;
  if (ship.pax <= 1200) return 6;
  return 11;
};

export const getTierLabel = (pax) => {
  if (pax < 300) return "1×";
  if (pax <= 600) return "3×";
  if (pax <= 1200) return "6×";
  return "11×";
};
export const PALLETS_PER_PAX_TRANSIT = 0.008;
export const PALLETS_PER_PAX_TURNAROUND = 0.025;
export const LUGGAGE_PER_PAX_TURNAROUND = 1.8;
export const CREW_PER_1000_PAX_TRANSIT = 3;
export const CREW_PER_1000_PAX_TURNAROUND = 12;
export const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep"];
export const MONTH_NUMS = [5, 6, 7, 8, 9];

export const IPS_BLUE = "#0C2C40";
export const IPS_ACCENT = "#57B5C8";
export const IPS_ACCENT2 = "#458CA7";
export const IPS_WARN = "#F59E0B";
export const IPS_DANGER = "#EF4444";
export const IPS_SUCCESS = "#22C55E";
export const SURFACE = "#112F45";
export const BORDER = "#1A4A60";
export const TEXT = "#F6F7F7";
export const TEXT_DIM = "#B5BACB";
export const OTHER_COLOR = "#475569";
export const SAMSKIP_COLOR = "#F97316";

export const SDK_COLOR = "#8B5CF6";

// ─── BERTHS ──────────────────────────────────────────────────────────────────
// Canonical berth names at Reykjavík. Used on invoices and (eventually) to
// validate / tag SHIPS entries with where each call docked.
export const BERTHS = [
  // Reykjavík
  "VÖR", "Skarfabakki", "Korngarður", "Miðbakki", "Faxagarður", "Kleppsbakki",
  // Akureyri
  "Tangabryggja 11a", "Tangabryggja 11b", "Oddeyrarbryggja 12", "Torfunef", "Krossanes 1a",
];

// Strip the trailing " (Cruise Line)" from a job's ship field.
export function extractShipName(shipStr) {
  if (!shipStr) return "";
  return shipStr.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// Find the berth for a given ship + date by matching against SHIPS entries.
// Returns the berth string or null if unknown.
export function getBerthForShip(shipStr, dateIso) {
  if (!shipStr || !dateIso) return null;
  const name = extractShipName(shipStr);
  if (!name) return null;
  const entry = SHIPS.find(
    (s) => s.ship === name && dateIso >= s.date && dateIso <= (s.endDate || s.date),
  );
  return entry?.berth || null;
}

// Find the cruise line for a given ship + date. Falls back to parsing a
// trailing "(Cruise Line)" if present (legacy job data stored ship as
// "Ship Name (Cruise Line)").
export function getCruiseLineForShip(shipStr, dateIso) {
  if (!shipStr) return "";
  const m = shipStr.match(/\(([^)]+)\)\s*$/);
  if (m) return m[1].trim();
  if (!dateIso) return "";
  const name = extractShipName(shipStr);
  const entry = SHIPS.find(
    (s) => s.ship === name && dateIso >= s.date && dateIso <= (s.endDate || s.date),
  );
  return entry?.line || "";
}
export const SDK_LINES = ["Aida", "Ambassador", "Carnival", "Costa", "Cunard", "Hapag-Lloyd", "P&O", "Phoenix Reisen", "TUI"];

// Cruise lines IPS has a direct contract with (no SDK/Samskip agent in between).
// Used together with SDK_LINES to drive the calendar's "ORDER missing" pills:
// any visit by one of these lines without a logged job shows up as pending.
export const DIRECT_CONTRACT_LINES = ["Viking", "Holland America", "Seabourn", "Princess Cruises"];

// ─── PROSPECT GROUPS ─────────────────────────────────────────────────────────
// Cruise line groupings used by the Market Intel what-if dropdown and a few
// rate-routing lookups. "ips" and "sdk" are real contracts; "samskip" is the
// agent we don't have a direct line with — kept here so the dropdown can
// model "what if Samskip lines moved to us?".
export const PROSPECT_GROUPS = {
  ips: {
    label: "IPS Direct",
    color: IPS_ACCENT,
    lines: DIRECT_CONTRACT_LINES,
  },
  sdk: {
    label: "SDK",
    color: SDK_COLOR,
    lines: SDK_LINES,
  },
  samskip: {
    label: "Samskip",
    color: SAMSKIP_COLOR,
    lines: ["Oceania", "Norwegian Cruise Line", "Regent", "Peace Boat", "Virgin", "Crystal"],
  },
};

// ─── AGENCY (Akureyri boarding agent) ────────────────────────────────────────
// Billed to our boarding agent in Akureyri. Every call carries a flat base
// fee; delivery + custom services are added per call in the agency modal.
export const AGENCY_BASE_FEE = 60000;      // Agency Base Fee (AKU), flat per call
export const AGENCY_DELIVERY_FEE = 4000;   // optional delivery fee
export const AGENCY_BASE_LABEL = "Agency Base Fee (AKU)";
export const AGENCY_DELIVERY_LABEL = "Delivery Fee";
export const AGENCY_BOARDING_AGENT = "Eysteinn Kári";
// Agency service started on this date — no "A" chip on earlier calls.
export const AGENCY_START_DATE = "2026-06-19";

// ─── JOB ORDER CONFIG ────────────────────────────────────────────────────────
export const JOB_TYPES = {
  provisions:     { label: "Provisions",     color: "#22C55E" },
  waste:          { label: "Waste",          color: "#F59E0B" },
  turnaround:     { label: "Turnaround",     color: "#A78BFA" },
  cherry_picker:  { label: "Cherry Picker",  color: "#3B82F6" },
  special:        { label: "Special",        color: "#06B6D4" },
  // Bindingar (mooring/tying): REY-only, no hour logging. Billed monthly
  // in bulk to Faxaflóahafnir at a flat rate per resource per job.
  bindingar:      { label: "Bindingar",      color: "#14B8A6", reyOnly: true, noHours: true, monthlyBilled: true },
  // Agency (boarding agent, Akureyri only): flat Agency Base Fee per call
  // plus optional delivery / custom line items. Not a resource job — logged
  // and completed in one step via the agency modal, billed to the agent.
  agency:         { label: "Agency", short: "A", color: "#EC4899", akuOnly: true, noHours: true },
  // "No Job" marker — used when the user has confirmed there is no IPS
  // work for this ship call. Renders dimmed-red on the calendar instead of
  // the pending ORDER pill. Not pickable from the type buttons.
  no_job:         { label: "No Job",         color: "#EF4444", marker: true },
};

// Service codes used in the Payday invoice "Tilvísun" (reference) field,
// composed as "{po_number} {SERVICE_CODES[job.type]}".
// Special jobs vary case by case — defaulting to CP since the most common
// ad-hoc rental is a Cherry Picker; override in Payday if not a CP rental.
export const SERVICE_CODES = {
  provisions:    "P",
  waste:         "W",
  turnaround:    "L",
  cherry_picker: "CP",
  special:       "CP",
  bindingar:     "B",
  // Agency (Akureyri boarding agent). The "A" code already implies AKU
  // since agency is Akureyri-only, so the composer skips the AKU suffix
  // for this type.
  agency:        "A",
};

// Full service names for the Payday invoice comment (Athugasemdir).
// Turnaround prints as "Luggage Operation" on the invoice per IPS convention.
export const SERVICE_FULL_NAMES = {
  provisions:    "Provision Loading",
  waste:         "Waste Offload",
  turnaround:    "Luggage Operation",
  cherry_picker: "Cherry Picker rental",
  special:       "Special Operation",
  bindingar:     "Bindingar",
};

// Port a job is performed in. Akureyri jobs are SDK-billed by default.
export const PORTS = {
  REY: { label: "REY", longLabel: "Reykjavík", color: "#57B5C8" },
  AK:  { label: "AK",  longLabel: "Akureyri",  color: "#F97316" },
};
export const JOB_EQUIPMENT_BY_TYPE = {
  provisions: {
    forklift:             { label: "Forklift", autoOperator: "forklift_op" },
    forklift_op:          { label: "Forklift Operator", auto: true, human: true },
    telescopic:           { label: "Telescopic Forklift", autoOperator: "telescopic_op" },
    telescopic_op:        { label: "Forklift Operator", auto: true, human: true },
    foreman:              { label: "Foreman", human: true },
    stevedore:            { label: "Stevedore", human: true },
    ramp:                 { label: "Container Ramp", flatDay: true },
    crane:                { label: "Crane", autoOperator: "crane_op" },
    crane_op:             { label: "Crane Operator", auto: true, human: true },
    pallet_cage:          { label: "Pallet Cage", flatDay: true },
    pallet_jack_manual:   { label: "Manual Pallet Jack", flatDay: true },
    pallet_jack_electric: { label: "Electric Pallet Jack", flatDay: true },
  },
  waste: {
    forklift:             { label: "Forklift", autoOperator: "forklift_op" },
    forklift_op:          { label: "Forklift Operator", auto: true, human: true },
    telescopic:           { label: "Telescopic Forklift", autoOperator: "telescopic_op" },
    telescopic_op:        { label: "Forklift Operator", auto: true, human: true },
    foreman:              { label: "Foreman", human: true },
    stevedore:            { label: "Stevedore", human: true },
    ramp:                 { label: "Container Ramp", flatDay: true },
    crane:                { label: "Crane", autoOperator: "crane_op" },
    crane_op:             { label: "Crane Operator", auto: true, human: true },
    pallet_cage:          { label: "Pallet Cage", flatDay: true },
    pallet_jack_manual:   { label: "Manual Pallet Jack", flatDay: true },
    pallet_jack_electric: { label: "Electric Pallet Jack", flatDay: true },
  },
  turnaround: {
    forklift:             { label: "Forklift", autoOperator: "forklift_op" },
    forklift_op:          { label: "Forklift Operator", auto: true, human: true },
    telescopic:           { label: "Telescopic Forklift", autoOperator: "telescopic_op" },
    telescopic_op:        { label: "Forklift Operator", auto: true, human: true },
    foreman:              { label: "Foreman", human: true },
    conveyor_belt:        { label: "Conveyor Belt", autoOperator: "conveyor_op" },
    conveyor_op:          { label: "Conveyor Belt Operator", auto: true, human: true },
    luggage_van:          { label: "Luggage Van" },
    luggage_cage:         { label: "Luggage Cage", flatDay: true },
    porter:               { label: "Porter", human: true },
    // Viking turnaround is invoiced as a flat fee per call (see rates.js
    // turnaroundFlat). For Viking turnaround jobs the form logs this single
    // service instead of itemised resources. `hidden` keeps it out of the
    // normal resource grid; `flatService` suppresses hour display.
    turnaround_service:   { label: "Turnaround Service", hidden: true, flatService: true },
  },
  cherry_picker: {
    // Four cherry-picker sizes, billed per-day. Rate is all-inclusive
    // (transfer, fuel, etc. — see rates.js). Only SDK customers; misuse on
    // a non-SDK job renders the line as "—" via generateInvoice's
    // pushUnpriced fallback. Use the form's quantity field to enter the
    // number of rental days (qty × day rate = invoice total per row).
    cherry_picker_22m:    { label: "Cherry Picker 22m", flatDay: true },
    cherry_picker_25m:    { label: "Cherry Picker 25m", flatDay: true },
    cherry_picker_40m:    { label: "Cherry Picker 40m", flatDay: true },
    cherry_picker_60m:    { label: "Cherry Picker 60m", flatDay: true },
    // CP rentals are usually self-operated by the customer's crew; we
    // occasionally supply an operator. Not auto-attached when picking a
    // cherry picker — opt in manually. Billed at the Crane Operator rate
    // (SDK 12,480 / 15,930; Akureyri 16,060 / 19,272).
    cherry_picker_op:     { label: "Cherry Picker Operator", human: true },
  },
  special: {
    forklift:             { label: "Forklift", autoOperator: "forklift_op" },
    forklift_op:          { label: "Forklift Operator", auto: true, human: true },
    telescopic:           { label: "Telescopic Forklift", autoOperator: "telescopic_op" },
    telescopic_op:        { label: "Forklift Operator", auto: true, human: true },
    foreman:              { label: "Foreman", human: true },
    crane:                { label: "Crane", autoOperator: "crane_op" },
    crane_op:             { label: "Crane Operator", auto: true, human: true },
    conveyor_belt:        { label: "Conveyor Belt", autoOperator: "conveyor_op" },
    conveyor_op:          { label: "Conveyor Belt Operator", auto: true, human: true },
    luggage_van:          { label: "Luggage Van" },
    ramp:                 { label: "Container Ramp", flatDay: true },
    pallet_cage:          { label: "Pallet Cage", flatDay: true },
    luggage_cage:         { label: "Luggage Cage", flatDay: true },
    pallet_jack_manual:   { label: "Manual Pallet Jack", flatDay: true },
    pallet_jack_electric: { label: "Electric Pallet Jack", flatDay: true },
    stevedore:            { label: "Stevedore", human: true },
    porter:               { label: "Porter", human: true },
  },
  // Bindingar (mooring): just two resources. No hours, no shifts — the
  // quantity is the unit. Billed monthly in bulk to Faxaflóahafnir.
  bindingar: {
    endamadur: { label: "Endamaður", perJob: true },
    lyftari:   { label: "Lyftari",   perJob: true },
  },
};

// ─── WORKSPACE CONFIG ────────────────────────────────────────────────────────
export const WS_TEAM = {
  jon:     { name: "Jón", initials: "JH", color: "#57B5C8" },
  tristan: { name: "Tristan", initials: "TH", color: "#F59E0B" },
};
export const WS_PROJECTS = {
  operations: { label: "Operations",    color: "#22C55E" },
  sales:      { label: "Sales & BD",    color: "#A78BFA" },
  dashboard:  { label: "Dashboard Dev", color: "#57B5C8" },
  general:    { label: "General",       color: "#64748B" },
};
export const WS_PRIORITIES = {
  high:   { label: "High",   color: "#EF4444" },
  medium: { label: "Medium", color: "#F59E0B" },
  low:    { label: "Low",    color: "#22C55E" },
};
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

// ─── CFO CONFIG ─────────────────────────────────────────────────────────────
export const CFO_SERVICE_TYPES = {
  luggage_handling:   { label: "Luggage Handling",   color: "#57B5C8" },
  provision_loading:  { label: "Provision Loading",  color: "#22C55E" },
  waste_offload:      { label: "Waste Offload",      color: "#F59E0B" },
  other:              { label: "Other",              color: "#64748B" },
};
export const CFO_UNITS = {
  per_pax:    "Per Pax",
  per_pallet: "Per Pallet",
  per_call:   "Per Call",
  per_hour:   "Per Hour",
  flat:       "Flat Rate",
};
export const CFO_EXPENSE_CATS = {
  payroll:     { label: "Payroll",     color: "#57B5C8" },
  equipment:   { label: "Equipment",   color: "#F59E0B" },
  fuel:        { label: "Fuel",        color: "#EF4444" },
  maintenance: { label: "Maintenance", color: "#A78BFA" },
  insurance:   { label: "Insurance",   color: "#22C55E" },
  rent:        { label: "Rent",        color: "#458CA7" },
  utilities:   { label: "Utilities",   color: "#64748B" },
  other:       { label: "Other",       color: "#475569" },
};
export const CFO_STAFF_TYPES = { employee: "Employee", contractor: "Contractor", seasonal: "Seasonal" };
export const CFO_INV_STATUS = {
  draft:     { label: "Draft",     color: "#64748B" },
  sent:      { label: "Sent",      color: "#57B5C8" },
  paid:      { label: "Paid",      color: "#22C55E" },
  overdue:   { label: "Overdue",   color: "#EF4444" },
  cancelled: { label: "Cancelled", color: "#475569" },
};
export const fmtISK = (a) => a == null ? "—" : Number(a).toLocaleString("is-IS") + " kr.";
