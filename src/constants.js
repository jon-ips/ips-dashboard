// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE 2026 REYKJAVÍK SEASON — CORRECTED DOKK DATA
// ═══════════════════════════════════════════════════════════════════════════════
export const SHIPS = [
  // ─── MAY ────────────────────────────────────────────────────────────────────
  { date: "2026-05-04", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-08", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-05-13", endDate: "2026-05-14", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-15", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-05-19", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-20", endDate: "2026-05-21", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-05-22", endDate: null, line: "Carnival", ship: "Carnival Miracle", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-05-23", endDate: null, line: "Hapag-Lloyd", ship: "Europa 2", turnaround: false, pax: 706, status: "other" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-05-26", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-27", endDate: "2026-05-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-28", endDate: "2026-05-30", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-05-29", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-05-29", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  // ─── JUNE ───────────────────────────────────────────────────────────────────
  { date: "2026-06-02", endDate: null, line: "Peace Boat", ship: "Pacific World", turnaround: false, pax: 1950, status: "other" },
  { date: "2026-06-02", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-06-03", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-06-06", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "contracted" },
  { date: "2026-06-07", endDate: "2026-06-08", line: "Celebrity", ship: "Celebrity Eclipse", turnaround: false, pax: 2852, status: "other" },
  { date: "2026-06-07", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-06-08", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-08", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "other" },
  { date: "2026-06-08", endDate: "2026-06-09", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other" },
  { date: "2026-06-10", endDate: "2026-06-11", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-06-13", endDate: "2026-06-14", line: "MSC", ship: "MSC Virtuosa", turnaround: false, pax: 6297, status: "other" },
  { date: "2026-06-14", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-06-14", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-06-15", endDate: "2026-06-16", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-06-16", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "other" },
  { date: "2026-06-17", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-17", endDate: "2026-06-18", line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other" },
  { date: "2026-06-18", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other" },
  { date: "2026-06-18", endDate: "2026-06-19", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other" },
  { date: "2026-06-20", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-21", endDate: "2026-06-23", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-21", endDate: "2026-06-22", line: "Nicko Cruises", ship: "Vasco da Gama", turnaround: false, pax: 1258, status: "other" },
  { date: "2026-06-21", endDate: "2026-06-22", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-06-23", endDate: null, line: "Princess", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-06-24", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-25", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "other" },
  { date: "2026-06-25", endDate: "2026-06-26", line: "P&O", ship: "Aurora", turnaround: false, pax: 1868, status: "other" },
  { date: "2026-06-25", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-25", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-06-26", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  { date: "2026-06-28", endDate: null, line: "Quark Expeditions", ship: "Ocean Nova", turnaround: true, pax: 78, status: "other" },
  { date: "2026-06-29", endDate: "2026-06-30", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-30", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  // ─── JULY ───────────────────────────────────────────────────────────────────
  { date: "2026-07-01", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-07-01", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-01", endDate: "2026-07-02", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-07-02", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: false, pax: 230, status: "other" },
  { date: "2026-07-03", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-03", endDate: null, line: "Fred Olsen", ship: "Borealis", turnaround: false, pax: 1360, status: "other" },
  { date: "2026-07-03", endDate: null, line: "Carnival", ship: "Carnival Legend", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-07-04", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-04", endDate: null, line: "Saga", ship: "Spirit of Discovery", turnaround: false, pax: 999, status: "other" },
  { date: "2026-07-05", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-05", endDate: "2026-07-06", line: "Holland America", ship: "Volendam", turnaround: false, pax: 1432, status: "contracted" },
  { date: "2026-07-06", endDate: "2026-07-07", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-06", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-07-07", endDate: null, line: "Princess", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-07-08", endDate: "2026-07-09", line: "P&O", ship: "Britannia", turnaround: false, pax: 3647, status: "other" },
  { date: "2026-07-08", endDate: null, line: "Princess", ship: "Crown Princess", turnaround: false, pax: 3599, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-07-09", endDate: "2026-07-10", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other" },
  { date: "2026-07-10", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-07-11", endDate: "2026-07-12", line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "other" },
  { date: "2026-07-11", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-11", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-07-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other" },
  { date: "2026-07-13", endDate: "2026-07-14", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-13", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other" },
  { date: "2026-07-15", endDate: null, line: "TUI", ship: "Mein Schiff 3", turnaround: false, pax: 2506, status: "other" },
  { date: "2026-07-16", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "contracted" },
  { date: "2026-07-16", endDate: "2026-07-17", line: "Regent", ship: "Seven Seas Mariner", turnaround: true, pax: 700, status: "other" },
  { date: "2026-07-17", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "other" },
  { date: "2026-07-17", endDate: "2026-07-18", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-18", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-18", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-19", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-19", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-07-20", endDate: "2026-07-21", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-20", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "contracted" },
  { date: "2026-07-20", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-07-22", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: false, pax: 809, status: "other" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Oceania", ship: "Vista", turnaround: true, pax: 1200, status: "other" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-07-23", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-07-24", endDate: "2026-07-25", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-24", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "other" },
  { date: "2026-07-24", endDate: null, line: "Carnival", ship: "Carnival Miracle", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-07-25", endDate: null, line: "Regent", ship: "Renaissance", turnaround: false, pax: 694, status: "other" },
  { date: "2026-07-26", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-26", endDate: "2026-07-28", line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-07-26", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "contracted" },
  { date: "2026-07-27", endDate: "2026-07-28", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-27", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-27", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-07-27", endDate: "2026-07-29", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-07-29", endDate: "2026-07-30", line: "Holland America", ship: "Zuiderdam", turnaround: false, pax: 2272, status: "contracted" },
  { date: "2026-07-30", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 186, status: "other" },
  { date: "2026-07-30", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-07-31", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  // ─── AUGUST ─────────────────────────────────────────────────────────────────
  { date: "2026-08-01", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-01", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "other" },
  { date: "2026-08-02", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-02", endDate: "2026-08-03", line: "Cunard", ship: "Queen Anne", turnaround: false, pax: 2650, status: "other" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-03", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "other" },
  { date: "2026-08-04", endDate: null, line: "SunStone Ships", ship: "Ocean Explorer", turnaround: true, pax: 140, status: "other" },
  { date: "2026-08-04", endDate: "2026-08-05", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-08-05", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-05", endDate: "2026-08-07", line: "Viking", ship: "Viking Saturn", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-06", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 186, status: "other" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-07", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "other" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "TUI", ship: "Mein Schiff 7", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-08-08", endDate: null, line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other" },
  { date: "2026-08-08", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-08", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-08-09", endDate: "2026-08-10", line: "P&O", ship: "Arcadia", turnaround: false, pax: 1994, status: "other" },
  { date: "2026-08-10", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-10", endDate: null, line: "Albatros Expeditions", ship: "Ocean Albatros", turnaround: true, pax: 189, status: "other" },
  { date: "2026-08-10", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-10", endDate: "2026-08-11", line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Aida", ship: "AIDAbella", turnaround: false, pax: 2050, status: "other" },
  { date: "2026-08-12", endDate: "2026-08-13", line: "Cunard", ship: "Queen Mary 2", turnaround: false, pax: 2691, status: "other" },
  { date: "2026-08-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other" },
  { date: "2026-08-13", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1285, status: "other" },
  { date: "2026-08-14", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "other" },
  { date: "2026-08-14", endDate: null, line: "Holland America", ship: "Nieuw Statendam", turnaround: false, pax: 2650, status: "contracted" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: false, pax: 2770, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-08-16", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-16", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-08-16", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-08-16", endDate: "2026-08-17", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-17", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "contracted" },
  { date: "2026-08-17", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-17", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Ritz-Carlton", ship: "Evrima", turnaround: true, pax: 298, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-08-18", endDate: "2026-08-20", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-08-19", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-08-19", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-20", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-20", endDate: null, line: "Regent", ship: "Seven Seas Voyager", turnaround: false, pax: 700, status: "other" },
  { date: "2026-08-21", endDate: "2026-08-22", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-21", endDate: "2026-08-22", line: "SunStone Ships", ship: "Ocean Adventurer", turnaround: true, pax: 132, status: "other" },
  { date: "2026-08-22", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "contracted" },
  { date: "2026-08-23", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-08-23", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1285, status: "other" },
  { date: "2026-08-24", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-24", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-08-26", endDate: null, line: "Phoenix Reisen", ship: "Amera", turnaround: false, pax: 835, status: "other" },
  { date: "2026-08-27", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-27", endDate: "2026-08-28", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-08-29", endDate: null, line: "Aida", ship: "AIDAdiva", turnaround: false, pax: 1025, status: "other" },
  { date: "2026-08-29", endDate: "2026-08-30", line: "TUI", ship: "Mein Schiff 1", turnaround: false, pax: 2894, status: "other" },
  { date: "2026-08-30", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-08-30", endDate: "2026-08-31", line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-08-31", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-08-31", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-31", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  // ─── SEPTEMBER ──────────────────────────────────────────────────────────────
  { date: "2026-09-01", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-09-01", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  { date: "2026-09-02", endDate: "2026-09-03", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-09-03", endDate: null, line: "Princess", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-09-05", endDate: null, line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 318, status: "other" },
  { date: "2026-09-06", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: true, pax: 2770, status: "other" },
  { date: "2026-09-07", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-09-07", endDate: "2026-09-08", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "other" },
  { date: "2026-09-08", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-09-08", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-09", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-09-10", endDate: "2026-09-12", line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other" },
  { date: "2026-09-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-09-11", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-09-15", endDate: null, line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other" },
  { date: "2026-09-15", endDate: null, line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "other" },
  { date: "2026-09-16", endDate: "2026-09-17", line: "Explora Journeys", ship: "Explora 3", turnaround: true, pax: 962, status: "other" },
  { date: "2026-09-17", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-18", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-09-18", endDate: "2026-09-19", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other" },
  { date: "2026-09-19", endDate: null, line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 318, status: "other" },
  { date: "2026-09-19", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-09-20", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-09-20", endDate: "2026-09-21", line: "SunStone Ships", ship: "Ocean Adventurer", turnaround: true, pax: 132, status: "other" },
  { date: "2026-09-21", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-09-21", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-09-21", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 196, status: "other" },
  { date: "2026-09-23", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-09-24", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: true, pax: 230, status: "other" },
  { date: "2026-09-26", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-26", endDate: null, line: "Princess", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-09-27", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-09-27", endDate: "2026-09-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
];

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
export const SDK_LINES = ["Aida", "Ambassador", "Costa", "Cunard", "Hapag-Lloyd", "P&O", "Phoenix Reisen", "TUI"];

// ─── PROSPECT GROUPS ─────────────────────────────────────────────────────────
export const PROSPECT_GROUPS = {
  sdk: {
    label: "SDK",
    color: SDK_COLOR,
    lines: SDK_LINES,
  },
  samskip: {
    label: "Samskip",
    color: SAMSKIP_COLOR,
    lines: ["Oceania", "Norwegian Cruise Line", "Regent", "Carnival", "Peace Boat", "Virgin"],
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
