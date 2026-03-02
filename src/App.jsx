import { useState, useMemo, useCallback, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE 2026 REYKJAVÍK SEASON — CORRECTED DOKK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SHIPS = [
  // ─── MAY ────────────────────────────────────────────────────────────────────
  { date: "2026-05-04", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-08", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-05-13", endDate: "2026-05-14", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-15", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-05-19", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-20", endDate: "2026-05-21", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-05-22", endDate: null, line: "Carnival", ship: "Carnival Miracle", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-05-23", endDate: null, line: "Hapag-Lloyd", ship: "Europa 2", turnaround: false, pax: 706, status: "contracted" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-05-26", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-27", endDate: "2026-05-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-28", endDate: "2026-05-30", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
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
  { date: "2026-06-08", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "contracted" },
  { date: "2026-06-08", endDate: "2026-06-09", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-06-10", endDate: "2026-06-11", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-06-13", endDate: "2026-06-14", line: "MSC", ship: "MSC Virtuosa", turnaround: false, pax: 6297, status: "other" },
  { date: "2026-06-14", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-06-14", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-06-15", endDate: "2026-06-16", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-06-16", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "contracted" },
  { date: "2026-06-17", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-17", endDate: "2026-06-18", line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "contracted" },
  { date: "2026-06-18", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other" },
  { date: "2026-06-18", endDate: "2026-06-19", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "contracted" },
  { date: "2026-06-20", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-21", endDate: "2026-06-23", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-21", endDate: "2026-06-22", line: "Nicko Cruises", ship: "Vasco da Gama", turnaround: false, pax: 1258, status: "other" },
  { date: "2026-06-21", endDate: "2026-06-22", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-06-23", endDate: null, line: "Princess", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-06-24", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-25", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "prospect" },
  { date: "2026-06-25", endDate: "2026-06-26", line: "P&O", ship: "Aurora", turnaround: false, pax: 1868, status: "contracted" },
  { date: "2026-06-25", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-25", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-06-26", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  { date: "2026-06-28", endDate: null, line: "Quark Expeditions", ship: "Ocean Nova", turnaround: true, pax: 78, status: "other" },
  { date: "2026-06-29", endDate: "2026-06-30", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-30", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  // ─── JULY ───────────────────────────────────────────────────────────────────
  { date: "2026-07-01", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-07-01", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-01", endDate: "2026-07-02", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-07-02", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: false, pax: 230, status: "contracted" },
  { date: "2026-07-03", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-03", endDate: null, line: "Fred Olsen", ship: "Borealis", turnaround: false, pax: 1360, status: "other" },
  { date: "2026-07-03", endDate: null, line: "Carnival", ship: "Carnival Legend", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-07-04", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-04", endDate: null, line: "Saga", ship: "Spirit of Discovery", turnaround: false, pax: 999, status: "other" },
  { date: "2026-07-05", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-05", endDate: "2026-07-06", line: "Holland America", ship: "Volendam", turnaround: false, pax: 1432, status: "contracted" },
  { date: "2026-07-06", endDate: "2026-07-07", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-06", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-07-07", endDate: null, line: "Princess", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-07-08", endDate: "2026-07-09", line: "P&O", ship: "Britannia", turnaround: false, pax: 3647, status: "contracted" },
  { date: "2026-07-08", endDate: null, line: "Princess", ship: "Crown Princess", turnaround: false, pax: 3599, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-07-09", endDate: "2026-07-10", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "contracted" },
  { date: "2026-07-10", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-07-11", endDate: "2026-07-12", line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "prospect" },
  { date: "2026-07-11", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-11", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-07-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-07-13", endDate: "2026-07-14", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-13", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-07-14", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "prospect" },
  { date: "2026-07-14", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other" },
  { date: "2026-07-15", endDate: null, line: "TUI", ship: "Mein Schiff 3", turnaround: false, pax: 2506, status: "contracted" },
  { date: "2026-07-16", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "contracted" },
  { date: "2026-07-16", endDate: "2026-07-17", line: "Regent", ship: "Seven Seas Mariner", turnaround: true, pax: 700, status: "prospect" },
  { date: "2026-07-17", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "contracted" },
  { date: "2026-07-17", endDate: "2026-07-18", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-18", endDate: null, line: "Viking", ship: "Viking Neptune", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-18", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-19", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-19", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-07-20", endDate: "2026-07-21", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-20", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "contracted" },
  { date: "2026-07-20", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-07-22", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: false, pax: 809, status: "prospect" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Oceania", ship: "Vista", turnaround: true, pax: 1200, status: "prospect" },
  { date: "2026-07-22", endDate: "2026-07-23", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-07-23", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-07-24", endDate: "2026-07-25", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-24", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "prospect" },
  { date: "2026-07-24", endDate: null, line: "Carnival", ship: "Carnival Miracle", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-07-25", endDate: null, line: "Regent", ship: "Renaissance", turnaround: false, pax: 694, status: "prospect" },
  { date: "2026-07-26", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-26", endDate: "2026-07-28", line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-07-26", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "contracted" },
  { date: "2026-07-27", endDate: "2026-07-28", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-27", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-27", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-07-27", endDate: "2026-07-29", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-07-29", endDate: "2026-07-30", line: "Holland America", ship: "Zuiderdam", turnaround: false, pax: 2272, status: "contracted" },
  { date: "2026-07-30", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 186, status: "other" },
  { date: "2026-07-30", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-07-31", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  // ─── AUGUST ─────────────────────────────────────────────────────────────────
  { date: "2026-08-01", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-01", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "prospect" },
  { date: "2026-08-02", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-02", endDate: "2026-08-03", line: "Cunard", ship: "Queen Anne", turnaround: false, pax: 2650, status: "other" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-03", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "prospect" },
  { date: "2026-08-04", endDate: null, line: "SunStone Ships", ship: "Ocean Explorer", turnaround: true, pax: 140, status: "other" },
  { date: "2026-08-04", endDate: "2026-08-05", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-08-05", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-05", endDate: "2026-08-07", line: "Viking", ship: "Viking Saturn", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-06", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 186, status: "other" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-07", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "contracted" },
  { date: "2026-08-07", endDate: "2026-08-08", line: "TUI", ship: "Mein Schiff 7", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-08-08", endDate: null, line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other" },
  { date: "2026-08-08", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-08", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-08-09", endDate: "2026-08-10", line: "P&O", ship: "Arcadia", turnaround: false, pax: 1994, status: "contracted" },
  { date: "2026-08-10", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-10", endDate: null, line: "Albatros Expeditions", ship: "Ocean Albatros", turnaround: true, pax: 189, status: "other" },
  { date: "2026-08-10", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-08-10", endDate: "2026-08-11", line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Aida", ship: "AIDAbella", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-08-12", endDate: "2026-08-13", line: "Cunard", ship: "Queen Mary 2", turnaround: false, pax: 2691, status: "other" },
  { date: "2026-08-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-08-13", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1285, status: "prospect" },
  { date: "2026-08-14", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "contracted" },
  { date: "2026-08-14", endDate: null, line: "Holland America", ship: "Nieuw Statendam", turnaround: false, pax: 2650, status: "contracted" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: false, pax: 2770, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "contracted" },
  { date: "2026-08-15", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-08-16", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-16", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-08-16", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-08-16", endDate: "2026-08-17", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-17", endDate: null, line: "Viking", ship: "Viking Vela", turnaround: true, pax: 998, status: "contracted" },
  { date: "2026-08-17", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-08-17", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Ritz-Carlton", ship: "Evrima", turnaround: true, pax: 298, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-08-18", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-08-18", endDate: "2026-08-20", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-08-19", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-08-19", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-20", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-20", endDate: null, line: "Regent", ship: "Seven Seas Voyager", turnaround: false, pax: 700, status: "prospect" },
  { date: "2026-08-21", endDate: "2026-08-22", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-21", endDate: "2026-08-22", line: "SunStone Ships", ship: "Ocean Adventurer", turnaround: true, pax: 132, status: "other" },
  { date: "2026-08-22", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "contracted" },
  { date: "2026-08-23", endDate: null, line: "Holland America", ship: "Rotterdam", turnaround: true, pax: 2106, status: "contracted" },
  { date: "2026-08-23", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1285, status: "prospect" },
  { date: "2026-08-24", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-08-24", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-08-26", endDate: null, line: "Phoenix Reisen", ship: "Amera", turnaround: false, pax: 835, status: "other" },
  { date: "2026-08-27", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-27", endDate: "2026-08-28", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-08-29", endDate: null, line: "Aida", ship: "AIDAdiva", turnaround: false, pax: 1025, status: "contracted" },
  { date: "2026-08-29", endDate: "2026-08-30", line: "TUI", ship: "Mein Schiff 1", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-08-30", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-08-30", endDate: "2026-08-31", line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-08-31", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-08-31", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "prospect" },
  { date: "2026-08-31", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  // ─── SEPTEMBER ──────────────────────────────────────────────────────────────
  { date: "2026-09-01", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-09-01", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "other" },
  { date: "2026-09-02", endDate: "2026-09-03", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "prospect" },
  { date: "2026-09-03", endDate: null, line: "Princess", ship: "Sky Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-09-05", endDate: null, line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 318, status: "other" },
  { date: "2026-09-06", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: true, pax: 2770, status: "other" },
  { date: "2026-09-07", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-09-07", endDate: "2026-09-08", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-09-08", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-09-08", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-09", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-09-10", endDate: "2026-09-12", line: "Azamara", ship: "Azamara Journey", turnaround: true, pax: 676, status: "other" },
  { date: "2026-09-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-09-11", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-09-15", endDate: null, line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other" },
  { date: "2026-09-15", endDate: null, line: "Ambassador", ship: "Ambience", turnaround: false, pax: 1596, status: "contracted" },
  { date: "2026-09-16", endDate: "2026-09-17", line: "Explora Journeys", ship: "Explora 3", turnaround: true, pax: 962, status: "other" },
  { date: "2026-09-17", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-18", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-09-18", endDate: "2026-09-19", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "prospect" },
  { date: "2026-09-19", endDate: null, line: "Hurtigruten", ship: "Fram", turnaround: true, pax: 318, status: "other" },
  { date: "2026-09-19", endDate: null, line: "Aurora Expeditions", ship: "Sylvia Earle", turnaround: true, pax: 152, status: "other" },
  { date: "2026-09-20", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-09-20", endDate: "2026-09-21", line: "SunStone Ships", ship: "Ocean Adventurer", turnaround: true, pax: 132, status: "other" },
  { date: "2026-09-21", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-09-21", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-09-21", endDate: null, line: "Atlas Ocean Voyages", ship: "World Voyager", turnaround: true, pax: 196, status: "other" },
  { date: "2026-09-23", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-09-24", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: true, pax: 230, status: "contracted" },
  { date: "2026-09-26", endDate: null, line: "Poseidon Expeditions", ship: "Sea Spirit", turnaround: true, pax: 114, status: "other" },
  { date: "2026-09-26", endDate: null, line: "Princess", ship: "Majestic Princess", turnaround: false, pax: 3560, status: "other" },
  { date: "2026-09-27", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-09-27", endDate: "2026-09-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SIMPLE_TURNAROUND_WEIGHT = 3;
const TRANSIT_WEIGHT = 1;

// Tiered turnaround weighting by pax capacity
const getTieredWeight = (ship) => {
  if (!ship.turnaround) return TRANSIT_WEIGHT;
  if (ship.pax < 300) return 1;    // Small expedition ≈ transit
  if (ship.pax <= 600) return 3;   // Mid-luxury
  if (ship.pax <= 1200) return 6;  // Premium mid-size
  return 11;                        // Large vessel turnaround
};

const getTierLabel = (pax) => {
  if (pax < 300) return "1×";
  if (pax <= 600) return "3×";
  if (pax <= 1200) return "6×";
  return "11×";
};
const PALLETS_PER_PAX_TRANSIT = 0.008;
const PALLETS_PER_PAX_TURNAROUND = 0.025;
const LUGGAGE_PER_PAX_TURNAROUND = 1.8;
const CREW_PER_1000_PAX_TRANSIT = 3;
const CREW_PER_1000_PAX_TURNAROUND = 12;
const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep"];
const MONTH_NUMS = [5, 6, 7, 8, 9];

const IPS_BLUE = "#0A1628";
const IPS_ACCENT = "#38BDF8";
const IPS_WARN = "#F59E0B";
const IPS_DANGER = "#EF4444";
const IPS_SUCCESS = "#22C55E";
const SURFACE = "#0F1D32";
const BORDER = "#1E3A5F";
const TEXT = "#E2E8F0";
const TEXT_DIM = "#64748B";
const PROSPECT_COLOR = "#A78BFA";
const OTHER_COLOR = "#475569";

// ─── WORKSPACE CONFIG ────────────────────────────────────────────────────────
const WS_TEAM = {
  jon:     { name: "Jón", initials: "JH", color: "#38BDF8" },
  tristan: { name: "Tristan", initials: "TH", color: "#F59E0B" },
};
const WS_PROJECTS = {
  operations: { label: "Operations",    color: "#22C55E" },
  sales:      { label: "Sales & BD",    color: "#A78BFA" },
  dashboard:  { label: "Dashboard Dev", color: "#38BDF8" },
  general:    { label: "General",       color: "#64748B" },
};
const WS_PRIORITIES = {
  high:   { label: "High",   color: "#EF4444" },
  medium: { label: "Medium", color: "#F59E0B" },
  low:    { label: "Low",    color: "#22C55E" },
};
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

export default function IPSDashboard() {
  // Lines the user has manually toggled to "contracted" via What-If
  const [wonLines, setWonLines] = useState(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [portCalFilter, setPortCalFilter] = useState(new Set());
  const [portCalDropOpen, setPortCalDropOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [calMonth, setCalMonth] = useState(5); // May=5
  const [calFilter, setCalFilter] = useState(new Set()); // extra lines toggled visible on calendar
  const [calDropOpen, setCalDropOpen] = useState(false);

  // ─── MODULE & WORKSPACE STATE ──────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState("market");
  const [wsView, setWsView] = useState("tasks");
  const [wsTasks, setWsTasks] = useState([]);
  const [wsLoaded, setWsLoaded] = useState(false);
  const [wsTaskModal, setWsTaskModal] = useState(null); // null | "new" | taskId
  const [wsTaskForm, setWsTaskForm] = useState({ title: "", description: "", assignee: "jon", project: "operations", priority: "medium", dueDate: "" });
  const [wsFilter, setWsFilter] = useState({ assignee: "all", project: "all", priority: "all", status: "all" });
  const [wsSortBy, setWsSortBy] = useState("dueDate");
  const [wsSortDir, setWsSortDir] = useState("asc");
  const [wsCalMonth, setWsCalMonth] = useState(new Date().getMonth());
  const [wsCalYear, setWsCalYear] = useState(new Date().getFullYear());
  const [wsExpandedTask, setWsExpandedTask] = useState(null);
  const [wsNewNote, setWsNewNote] = useState("");
  const [wsNoteAuthor, setWsNoteAuthor] = useState("jon");

  // ─── WORKSPACE STORAGE ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const raw = await window.storage.getItem("ws:tasks");
          if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) setWsTasks(p); }
        }
      } catch (e) { console.warn("Failed to load workspace tasks:", e); }
      finally { setWsLoaded(true); }
    })();
  }, []);

  const saveTasks = useCallback(async (tasks) => {
    setWsTasks(tasks);
    try { if (window.storage) await window.storage.setItem("ws:tasks", JSON.stringify(tasks), { shared: true }); }
    catch (e) { console.warn("Failed to save workspace tasks:", e); }
  }, []);

  const openNewTask = useCallback(() => {
    setWsTaskForm({ title: "", description: "", assignee: "jon", project: "operations", priority: "medium", dueDate: "" });
    setWsTaskModal("new");
  }, []);

  const openEditTask = useCallback((task) => {
    setWsTaskForm({ title: task.title, description: task.description, assignee: task.assignee, project: task.project, priority: task.priority, dueDate: task.dueDate || "" });
    setWsTaskModal(task.id);
  }, []);

  const saveTaskForm = useCallback(() => {
    if (!wsTaskForm.title.trim()) return;
    if (wsTaskModal === "new") {
      saveTasks([...wsTasks, { id: generateId(), ...wsTaskForm, dueDate: wsTaskForm.dueDate || null, completed: false, createdAt: new Date().toISOString(), completedAt: null, notes: [] }]);
    } else {
      saveTasks(wsTasks.map(t => t.id === wsTaskModal ? { ...t, ...wsTaskForm, dueDate: wsTaskForm.dueDate || null } : t));
    }
    setWsTaskModal(null);
  }, [wsTaskModal, wsTaskForm, wsTasks, saveTasks]);

  const toggleComplete = useCallback((id) => {
    saveTasks(wsTasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t));
  }, [wsTasks, saveTasks]);

  const deleteTask = useCallback((id) => {
    saveTasks(wsTasks.filter(t => t.id !== id));
    if (wsExpandedTask === id) setWsExpandedTask(null);
  }, [wsTasks, saveTasks, wsExpandedTask]);

  const addNote = useCallback((taskId) => {
    if (!wsNewNote.trim()) return;
    saveTasks(wsTasks.map(t => t.id === taskId ? { ...t, notes: [...(t.notes || []), { id: generateId(), author: wsNoteAuthor, text: wsNewNote.trim(), createdAt: new Date().toISOString() }] } : t));
    setWsNewNote("");
  }, [wsTasks, wsNewNote, wsNoteAuthor, saveTasks]);

  const filteredTasks = useMemo(() => {
    let result = [...wsTasks];
    if (wsFilter.assignee !== "all") result = result.filter(t => t.assignee === wsFilter.assignee);
    if (wsFilter.project !== "all") result = result.filter(t => t.project === wsFilter.project);
    if (wsFilter.priority !== "all") result = result.filter(t => t.priority === wsFilter.priority);
    if (wsFilter.status === "active") result = result.filter(t => !t.completed);
    if (wsFilter.status === "completed") result = result.filter(t => t.completed);
    const po = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      let c = 0;
      if (wsSortBy === "dueDate") c = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
      else if (wsSortBy === "priority") c = po[a.priority] - po[b.priority];
      else if (wsSortBy === "createdAt") c = a.createdAt.localeCompare(b.createdAt);
      else if (wsSortBy === "title") c = a.title.localeCompare(b.title);
      return wsSortDir === "desc" ? -c : c;
    });
    return result;
  }, [wsTasks, wsFilter, wsSortBy, wsSortDir]);

  const wsStats = useMemo(() => {
    const total = wsTasks.length, active = wsTasks.filter(t => !t.completed).length, done = wsTasks.filter(t => t.completed).length;
    const overdue = wsTasks.filter(t => !t.completed && t.dueDate && t.dueDate < new Date().toISOString().split("T")[0]).length;
    const byProject = {}, byAssignee = { jon: { total: 0, done: 0 }, tristan: { total: 0, done: 0 } };
    Object.keys(WS_PROJECTS).forEach(k => { byProject[k] = { total: 0, done: 0 }; });
    wsTasks.forEach(t => {
      if (byProject[t.project]) { byProject[t.project].total++; if (t.completed) byProject[t.project].done++; }
      if (byAssignee[t.assignee]) { byAssignee[t.assignee].total++; if (t.completed) byAssignee[t.assignee].done++; }
    });
    return { total, active, done, overdue, byProject, byAssignee };
  }, [wsTasks]);

  const toggleLine = useCallback((line) => {
    setWonLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line); else next.add(line);
      return next;
    });
  }, []);

  const isIPS = useCallback((ship) => {
    if (ship.status === "contracted") return true;
    if (wonLines.has(ship.line)) return true;
    return false;
  }, [wonLines]);

  // Build sorted list of all non-contracted lines for the dropdown
  const allNonContractedLines = useMemo(() => {
    const lines = {};
    SHIPS.forEach((s) => {
      if (s.status !== "contracted" && !lines[s.line]) {
        lines[s.line] = { status: s.status, calls: 0, turnarounds: 0, pax: 0 };
      }
      if (lines[s.line]) {
        lines[s.line].calls++;
        lines[s.line].pax += s.pax;
        if (s.turnaround) lines[s.line].turnarounds++;
      }
    });
    return Object.entries(lines).sort((a, b) => {
      if (a[1].status === "prospect" && b[1].status !== "prospect") return -1;
      if (b[1].status === "prospect" && a[1].status !== "prospect") return 1;
      return a[0].localeCompare(b[0]);
    });
  }, []);

  const isOvernight = (s) => s.endDate !== null;

  // Get the actual turnaround operations day for a ship
  // Viking rule: 2-night stays = ops on middle day, 1-night = ops on first day
  // General: single day = that day, multi-day = same logic applied universally
  const getTurnaroundOpsDate = (s) => {
    if (!s.turnaround) return null;
    if (!s.endDate) return s.date; // single day
    const start = new Date(s.date + "T12:00:00");
    const end = new Date(s.endDate + "T12:00:00");
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nights >= 2) {
      // Middle day (day after arrival)
      const mid = new Date(start);
      mid.setDate(mid.getDate() + 1);
      return mid.toISOString().split("T")[0];
    }
    // 1 night: ops on arrival day
    return s.date;
  };

  // ─── STATS ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let ipsCalls = 0, otherCalls = 0;
    let ipsSimpleW = 0, otherSimpleW = 0;
    let ipsTieredW = 0, otherTieredW = 0;
    let ipsTurnarounds = 0, ipsTransits = 0, ipsTurnaroundPax = 0;

    SHIPS.forEach((s) => {
      const sw = s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
      const tw = getTieredWeight(s);
      if (isIPS(s)) {
        ipsCalls++; ipsSimpleW += sw; ipsTieredW += tw;
        if (s.turnaround) { ipsTurnarounds++; ipsTurnaroundPax += s.pax; } else ipsTransits++;
      } else { otherCalls++; otherSimpleW += sw; otherTieredW += tw; }
    });

    const totalCalls = ipsCalls + otherCalls;
    const totalSimpleW = ipsSimpleW + otherSimpleW;
    const totalTieredW = ipsTieredW + otherTieredW;
    const callShare = totalCalls > 0 ? ((ipsCalls / totalCalls) * 100).toFixed(1) : 0;
    const simpleWShare = totalSimpleW > 0 ? ((ipsSimpleW / totalSimpleW) * 100).toFixed(1) : 0;
    const tieredShare = totalTieredW > 0 ? ((ipsTieredW / totalTieredW) * 100).toFixed(1) : 0;

    const monthly = MONTH_NUMS.map((m, i) => {
      const ms = SHIPS.filter((s) => new Date(s.date).getMonth() + 1 === m);
      let mIC = 0, mOC = 0, mISW = 0, mOSW = 0, mITW = 0, mOTW = 0, pallets = 0, luggage = 0, crew = 0;
      ms.forEach((s) => {
        const sw = s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
        const tw = getTieredWeight(s);
        if (isIPS(s)) {
          mIC++; mISW += sw; mITW += tw;
          pallets += s.pax * (s.turnaround ? PALLETS_PER_PAX_TURNAROUND : PALLETS_PER_PAX_TRANSIT);
          luggage += s.turnaround ? s.pax * LUGGAGE_PER_PAX_TURNAROUND : 0;
          crew += (s.pax / 1000) * (s.turnaround ? CREW_PER_1000_PAX_TURNAROUND : CREW_PER_1000_PAX_TRANSIT);
        } else { mOC++; mOSW += sw; mOTW += tw; }
      });
      return { month: MONTHS[i], monthNum: m, ipsCalls: mIC, otherCalls: mOC, ipsSimpleW: mISW, otherSimpleW: mOSW, ipsTieredW: mITW, otherTieredW: mOTW, totalCalls: mIC + mOC, pallets: Math.round(pallets), luggage: Math.round(luggage), crew: Math.ceil(crew) };
    });

    const lineBreakdown = {};
    SHIPS.forEach((s) => {
      if (!lineBreakdown[s.line]) lineBreakdown[s.line] = { calls: 0, turnarounds: 0, transits: 0, pax: 0, simpleW: 0, tieredW: 0, turnaroundPax: 0, status: (s.status !== "contracted" && wonLines.has(s.line)) ? "contracted" : s.status, baseStatus: s.status, overnights: 0 };
      lineBreakdown[s.line].calls++;
      lineBreakdown[s.line].pax += s.pax;
      lineBreakdown[s.line].simpleW += s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
      lineBreakdown[s.line].tieredW += getTieredWeight(s);
      if (s.turnaround) { lineBreakdown[s.line].turnarounds++; lineBreakdown[s.line].turnaroundPax += s.pax; } else lineBreakdown[s.line].transits++;
      if (isOvernight(s)) lineBreakdown[s.line].overnights++;
    });

    return { ipsCalls, otherCalls, totalCalls, callShare, simpleWShare, tieredShare, ipsSimpleW, otherSimpleW, totalSimpleW, ipsTieredW, otherTieredW, totalTieredW, ipsTurnarounds, ipsTransits, ipsTurnaroundPax, monthly, lineBreakdown };
  }, [isIPS, wonLines]);

  // ─── CRUNCH ─────────────────────────────────────────────────────────────────
  const crunchData = useMemo(() => {
    const allDates = {};
    SHIPS.forEach((s) => {
      if (!isIPS(s) || !s.turnaround) return;
      // Only flag the actual turnaround operations day
      const opsDate = getTurnaroundOpsDate(s);
      if (!opsDate) return;
      if (!allDates[opsDate]) allDates[opsDate] = { date: opsDate, ipsTurnarounds: 0, ipsShips: [] };
      allDates[opsDate].ipsTurnarounds++;
      allDates[opsDate].ipsShips.push({ ship: s.ship, line: s.line, pax: s.pax, overnight: isOvernight(s), arrivalDate: s.date, endDate: s.endDate });
    });
    return Object.values(allDates).filter((d) => d.ipsTurnarounds > 0).sort((a, b) => a.date.localeCompare(b.date));
  }, [isIPS]);

  const callPie = [{ name: "IPS", value: stats.ipsCalls, color: IPS_ACCENT }, { name: "Other", value: stats.otherCalls, color: "#334155" }];
  const simpleWPie = [{ name: "IPS", value: stats.ipsSimpleW, color: IPS_ACCENT }, { name: "Other", value: stats.otherSimpleW, color: "#334155" }];
  const tieredPie = [{ name: "IPS", value: stats.ipsTieredW, color: IPS_ACCENT }, { name: "Other", value: stats.otherTieredW, color: "#334155" }];

  // ─── COMPONENTS ─────────────────────────────────────────────────────────────
  const Card = ({ children, style, onClick }) => (<div onClick={onClick} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>);
  const SL = ({ children }) => (<div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 16 }}>{children}</div>);
  const NavTab = ({ label, view }) => (<button onClick={() => setActiveView(view)} style={{ background: activeView === view ? "rgba(56,189,248,0.1)" : "transparent", border: activeView === view ? `1px solid ${IPS_ACCENT}` : "1px solid transparent", borderRadius: 6, padding: "8px 16px", cursor: "pointer", color: activeView === view ? IPS_ACCENT : TEXT_DIM, fontSize: 13, fontWeight: 500, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" }}>{label}</button>);

  const CTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (<div style={{ background: "#0A1628", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: TEXT }}><div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>{payload.map((p, i) => (<div key={i} style={{ color: p.color, display: "flex", gap: 8 }}><span>{p.name}:</span><span style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span></div>))}</div>);
  };

  const PieCard = ({ data, sharePercent, title }) => (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>{title}</div>
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">{data.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{sharePercent}%</div>
            <div style={{ fontSize: 9, color: TEXT_DIM }}>IPS</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
          {data.map((d, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: TEXT_DIM }}><div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />{d.name}: <span style={{ fontFamily: "JetBrains Mono", color: d.color === IPS_ACCENT ? IPS_ACCENT : TEXT_DIM, fontWeight: 600 }}>{d.value}</span></div>))}
        </div>
      </div>
    </Card>
  );

  // ─── WORKSPACE COMPONENTS ───────────────────────────────────────────────────
  const ModuleTab = ({ label, mod, icon }) => (
    <button onClick={() => setActiveModule(mod)} style={{
      background: activeModule === mod ? "rgba(56,189,248,0.12)" : "transparent",
      border: activeModule === mod ? `1px solid ${IPS_ACCENT}` : "1px solid transparent",
      borderRadius: 8, padding: "6px 16px", cursor: "pointer",
      color: activeModule === mod ? IPS_ACCENT : TEXT_DIM,
      fontSize: 12, fontWeight: 600, transition: "all 0.2s",
      fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
    }}>{icon} {label}</button>
  );
  const WsNavTab = ({ label, view }) => (
    <button onClick={() => setWsView(view)} style={{
      background: wsView === view ? "rgba(56,189,248,0.1)" : "transparent",
      border: wsView === view ? `1px solid ${IPS_ACCENT}` : "1px solid transparent",
      borderRadius: 6, padding: "8px 16px", cursor: "pointer",
      color: wsView === view ? IPS_ACCENT : TEXT_DIM,
      fontSize: 13, fontWeight: 500, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
    }}>{label}</button>
  );
  const FilterPill = ({ label, active, color, onClick }) => (
    <button onClick={onClick} style={{
      background: active ? `${color || IPS_ACCENT}18` : "rgba(255,255,255,0.03)",
      border: `1px solid ${active ? (color || IPS_ACCENT) : BORDER}`,
      borderRadius: 6, padding: "5px 12px", cursor: "pointer",
      color: active ? (color || IPS_ACCENT) : TEXT_DIM,
      fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
    }}>{label}</button>
  );
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
    color: TEXT, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
  };

  const sortedLines = Object.entries(stats.lineBreakdown).sort((a, b) => {
    const order = { contracted: 0, prospect: 1, other: 2 };
    const diff = order[a[1].status] - order[b[1].status];
    return diff !== 0 ? diff : b[1].tieredW - a[1].tieredW;
  });

  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const fmtDateRange = (s) => {
    const start = fmtDate(s.date);
    if (!s.endDate) return start;
    const end = new Date(s.endDate + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit" });
    return `${start}–${end}`;
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: IPS_BLUE, color: TEXT, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap');::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${IPS_BLUE}}::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${SURFACE} 0%, ${IPS_BLUE} 100%)`, borderBottom: `1px solid ${BORDER}`, padding: "14px 24px", display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${IPS_ACCENT}, #0284C7)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", fontFamily: "JetBrains Mono" }}>IPS</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{activeModule === "market" ? "IPS Market Intelligence" : "IPS Workspace"}</div>
              <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{activeModule === "market" ? `Reykjavík · 2026 Season · ${SHIPS.length} port calls` : "Task & Project Management"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.25)", padding: 3, borderRadius: 8 }}>
            <ModuleTab label="Market Intel" mod="market" icon="📊" />
            <ModuleTab label="Workspace" mod="workspace" icon="📋" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", padding: 3, borderRadius: 8, alignSelf: "flex-start" }}>
          {activeModule === "market" ? (<>
            <NavTab label="Overview" view="overview" />
            <NavTab label="Calendar" view="calendar" />
            <NavTab label="Crunch Calendar" view="crunch" />
            <NavTab label="Port Calendar" view="portcal" />
            <NavTab label="Operations" view="operations" />
            <NavTab label="Fleet Intel" view="fleet" />
          </>) : (<>
            <WsNavTab label="Tasks" view="tasks" />
            <WsNavTab label="Calendar" view="calendar" />
            <WsNavTab label="Dashboard" view="dashboard" />
          </>)}
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1440, margin: "0 auto" }}>

        {activeModule === "market" && (<>
        {/* WHAT-IF */}
        <Card style={{ marginBottom: 20, background: `linear-gradient(90deg, rgba(167,139,250,0.05) 0%, ${SURFACE} 100%)`, border: `1px solid rgba(167,139,250,0.2)` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            {/* Left: dropdown */}
            <div style={{ flex: "1 1 400px", minWidth: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: PROSPECT_COLOR, fontFamily: "JetBrains Mono", marginBottom: 2 }}>What-If Scenario</div>
                  <div style={{ fontSize: 12, color: TEXT_DIM }}>Select cruise lines to model as IPS contracts</div>
                </div>
              </div>

              {/* Dropdown trigger */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${dropdownOpen ? PROSPECT_COLOR : BORDER}`,
                  borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s", color: TEXT,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                }}>
                  <span style={{ color: wonLines.size > 0 ? TEXT : TEXT_DIM }}>
                    {wonLines.size === 0 ? "Select cruise lines to add..." : `${wonLines.size} line${wonLines.size > 1 ? "s" : ""} added to IPS portfolio`}
                  </span>
                  <span style={{ color: TEXT_DIM, fontSize: 18, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                    background: SURFACE, border: `1px solid ${PROSPECT_COLOR}`, borderRadius: 8,
                    maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  }}>
                    {/* Prospects section */}
                    <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: PROSPECT_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                      Prospects
                    </div>
                    {allNonContractedLines.filter(([_, d]) => d.status === "prospect").map(([line, data]) => {
                      const checked = wonLines.has(line);
                      return (
                        <button key={line} onClick={() => toggleLine(line)} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                          background: checked ? "rgba(167,139,250,0.1)" : "transparent",
                          borderLeft: `3px solid ${checked ? PROSPECT_COLOR : "transparent"}`,
                        }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? PROSPECT_COLOR : BORDER}`, background: checked ? PROSPECT_COLOR : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                            {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left" }}>{line}</span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                        </button>
                      );
                    })}
                    {/* Other lines section */}
                    <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: OTHER_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>
                      Other Lines in Port
                    </div>
                    {allNonContractedLines.filter(([_, d]) => d.status !== "prospect").map(([line, data]) => {
                      const checked = wonLines.has(line);
                      return (
                        <button key={line} onClick={() => toggleLine(line)} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                          background: checked ? "rgba(56,189,248,0.08)" : "transparent",
                          borderLeft: `3px solid ${checked ? IPS_ACCENT : "transparent"}`,
                        }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? IPS_ACCENT : BORDER}`, background: checked ? IPS_ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                            {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left" }}>{line}</span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected chips */}
              {wonLines.size > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {[...wonLines].map((line) => {
                    const isProspect = allNonContractedLines.find(([l]) => l === line)?.[1]?.status === "prospect";
                    return (
                      <button key={line} onClick={() => toggleLine(line)} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: isProspect ? "rgba(167,139,250,0.15)" : "rgba(56,189,248,0.1)",
                        border: `1px solid ${isProspect ? PROSPECT_COLOR : IPS_ACCENT}`,
                        borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                      }}>
                        <span style={{ color: isProspect ? PROSPECT_COLOR : IPS_ACCENT, fontSize: 12, fontWeight: 500 }}>{line}</span>
                        <span style={{ color: isProspect ? PROSPECT_COLOR : IPS_ACCENT, fontSize: 14, lineHeight: 1 }}>×</span>
                      </button>
                    );
                  })}
                  <button onClick={() => setWonLines(new Set())} style={{
                    background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`,
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}>Clear all</button>
                </div>
              )}
            </div>

            {/* Right: share metrics */}
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(56,189,248,0.08)", borderRadius: 8, border: `1px solid rgba(56,189,248,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Calls</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{stats.callShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>{stats.ipsCalls}/{stats.totalCalls}</div>
              </div>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: `1px solid rgba(245,158,11,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Simple Wtd</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_WARN, fontFamily: "JetBrains Mono" }}>{stats.simpleWShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>(T)=3×</div>
              </div>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: `1px solid rgba(34,197,94,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Tiered Wtd</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_SUCCESS, fontFamily: "JetBrains Mono" }}>{stats.tieredShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>by pax tier</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ═══ OVERVIEW ═══ */}
        {activeView === "overview" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Port Total", v: stats.totalCalls, s: "all calls" },
              { l: "IPS Calls", v: stats.ipsCalls, c: IPS_ACCENT },
              { l: "IPS (T)", v: stats.ipsTurnarounds, c: IPS_WARN, s: "turnarounds" },
              { l: "IPS Transit", v: stats.ipsTransits, s: "transit" },
              { l: "(T) Pax Vol", v: (stats.ipsTurnaroundPax / 1000).toFixed(1) + "K", c: IPS_WARN, s: "turnaround pax" },
              { l: "Tiered Pts", v: stats.ipsTieredW, c: IPS_SUCCESS, s: `of ${stats.totalTieredW}` },
            ].map((x, i) => (<Card key={i}><div style={{ textAlign: "center" }}><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 28, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>{x.s && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{x.s}</div>}</div></Card>))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <PieCard data={callPie} sharePercent={stats.callShare} title="Call Count Share" />
            <PieCard data={simpleWPie} sharePercent={stats.simpleWShare} title="Simple Weighted (T=3×)" />
            <PieCard data={tieredPie} sharePercent={stats.tieredShare} title="Tiered Weighted (by pax)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <Card><SL>Monthly Call Volume</SL><ResponsiveContainer width="100%" height={220}><BarChart data={stats.monthly} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Bar dataKey="ipsCalls" name="IPS" fill={IPS_ACCENT} radius={[4, 4, 0, 0]} /><Bar dataKey="otherCalls" name="Other" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
            <Card><SL>Monthly Tiered Weighted Points</SL><ResponsiveContainer width="100%" height={220}><BarChart data={stats.monthly} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Bar dataKey="ipsTieredW" name="IPS Tiered" fill={IPS_SUCCESS} radius={[4, 4, 0, 0]} /><Bar dataKey="otherTieredW" name="Other Tiered" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
          </div>
          <Card><SL>Projected IPS Operations Volume</SL><ResponsiveContainer width="100%" height={250}><LineChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, color: TEXT_DIM }} /><Line type="monotone" dataKey="pallets" name="Pallets" stroke={IPS_ACCENT} strokeWidth={2.5} dot={{ r: 4, fill: IPS_ACCENT }} /><Line type="monotone" dataKey="luggage" name="Luggage" stroke={IPS_WARN} strokeWidth={2.5} dot={{ r: 4, fill: IPS_WARN }} /><Line type="monotone" dataKey="crew" name="Crew" stroke={IPS_SUCCESS} strokeWidth={2.5} dot={{ r: 4, fill: IPS_SUCCESS }} /></LineChart></ResponsiveContainer></Card>
        </>)}

        {/* ═══ CALENDAR ═══ */}
        {activeView === "calendar" && (() => {
          // Build daily port activity map including multi-day stays
          const dailyMap = {};
          SHIPS.forEach((s) => {
            const start = new Date(s.date + "T12:00:00");
            const end = s.endDate ? new Date(s.endDate + "T12:00:00") : start;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const key = d.toISOString().split("T")[0];
              if (!dailyMap[key]) dailyMap[key] = [];
              dailyMap[key].push(s);
            }
          });

          // Calendar only shows IPS + manually toggled lines
          const calVisible = (s) => isIPS(s) || calFilter.has(s.line);

          // All non-contracted lines for the toggle dropdown
          const nonIPSLines = {};
          SHIPS.forEach((s) => {
            if (s.status !== "contracted" && !wonLines.has(s.line)) {
              if (!nonIPSLines[s.line]) nonIPSLines[s.line] = { status: s.status, calls: 0, turnarounds: 0 };
              nonIPSLines[s.line].calls++;
              if (s.turnaround) nonIPSLines[s.line].turnarounds++;
            }
          });
          const sortedCalLines = Object.entries(nonIPSLines).sort((a, b) => {
            if (a[1].status === "prospect" && b[1].status !== "prospect") return -1;
            if (b[1].status === "prospect" && a[1].status !== "prospect") return 1;
            return a[0].localeCompare(b[0]);
          });

          const toggleCalLine = (line) => {
            setCalFilter((prev) => {
              const next = new Set(prev);
              if (next.has(line)) next.delete(line); else next.add(line);
              return next;
            });
          };

          const year = 2026;
          const monthIdx = calMonth - 1;
          const firstDay = new Date(year, monthIdx, 1);
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const startDow = (firstDay.getDay() + 6) % 7;
          const weeks = [];
          let week = new Array(startDow).fill(null);
          for (let d = 1; d <= daysInMonth; d++) {
            week.push(d);
            if (week.length === 7) { weeks.push(week); week = []; }
          }
          if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

          const monthNames = { 5: "May", 6: "June", 7: "July", 8: "August", 9: "September" };
          const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

          // Count IPS calls this month for summary
          const monthShips = SHIPS.filter(s => new Date(s.date).getMonth() + 1 === calMonth);
          const ipsThisMonth = monthShips.filter(s => isIPS(s));
          const ipsT = ipsThisMonth.filter(s => s.turnaround).length;

          return (
            <>
              {/* Month selector + filter */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                  {/* Left: month tabs + filter dropdown */}
                  <div style={{ flex: "1 1 400px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <SL>Season Calendar — {monthNames[calMonth]} 2026</SL>
                      <div style={{ display: "flex", gap: 4 }}>
                        {MONTH_NUMS.map((m, i) => (
                          <button key={m} onClick={() => setCalMonth(m)} style={{
                            background: calMonth === m ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${calMonth === m ? IPS_ACCENT : BORDER}`,
                            borderRadius: 6, padding: "6px 14px", cursor: "pointer",
                            color: calMonth === m ? IPS_ACCENT : TEXT_DIM, fontSize: 12, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                          }}>{MONTHS[i]}</button>
                        ))}
                      </div>
                    </div>

                    {/* Filter dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setCalDropOpen(!calDropOpen)} style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${calDropOpen ? IPS_ACCENT : BORDER}`,
                        borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s", color: TEXT,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      }}>
                        <span style={{ color: calFilter.size > 0 ? TEXT : TEXT_DIM }}>
                          {calFilter.size === 0 ? "Showing IPS contracted only — add other lines..." : `IPS + ${calFilter.size} additional line${calFilter.size > 1 ? "s" : ""}`}
                        </span>
                        <span style={{ color: TEXT_DIM, fontSize: 18, transform: calDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                      </button>

                      {calDropOpen && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                          background: SURFACE, border: `1px solid ${IPS_ACCENT}`, borderRadius: 8,
                          maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                        }}>
                          {/* Quick actions */}
                          <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
                            <button onClick={() => setCalFilter(new Set(sortedCalLines.map(([l]) => l)))} style={{ background: "rgba(56,189,248,0.1)", border: `1px solid rgba(56,189,248,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Show all</button>
                            <button onClick={() => setCalFilter(new Set())} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>IPS only</button>
                            <button onClick={() => { const pLines = sortedCalLines.filter(([_, d]) => d.status === "prospect").map(([l]) => l); setCalFilter(prev => { const next = new Set(prev); pLines.forEach(l => next.add(l)); return next; }); }} style={{ background: "rgba(167,139,250,0.1)", border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: PROSPECT_COLOR, fontSize: 10, fontFamily: "JetBrains Mono" }}>+ Prospects</button>
                          </div>
                          {/* Prospects */}
                          {sortedCalLines.filter(([_, d]) => d.status === "prospect").length > 0 && (
                            <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: PROSPECT_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>Prospects</div>
                          )}
                          {sortedCalLines.filter(([_, d]) => d.status === "prospect").map(([line, data]) => {
                            const checked = calFilter.has(line);
                            return (
                              <button key={line} onClick={() => toggleCalLine(line)} style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                                background: checked ? "rgba(167,139,250,0.1)" : "transparent",
                                borderLeft: `3px solid ${checked ? PROSPECT_COLOR : "transparent"}`,
                              }}>
                                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? PROSPECT_COLOR : BORDER}`, background: checked ? PROSPECT_COLOR : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                                  {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                                </div>
                                <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left" }}>{line}</span>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                              </button>
                            );
                          })}
                          {/* Other */}
                          {sortedCalLines.filter(([_, d]) => d.status !== "prospect").length > 0 && (
                            <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: OTHER_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>Other Lines</div>
                          )}
                          {sortedCalLines.filter(([_, d]) => d.status !== "prospect").map(([line, data]) => {
                            const checked = calFilter.has(line);
                            return (
                              <button key={line} onClick={() => toggleCalLine(line)} style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                                background: checked ? "rgba(56,189,248,0.08)" : "transparent",
                                borderLeft: `3px solid ${checked ? OTHER_COLOR : "transparent"}`,
                              }}>
                                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? OTHER_COLOR : BORDER}`, background: checked ? OTHER_COLOR : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                                  {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                                </div>
                                <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left" }}>{line}</span>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected chips */}
                    {calFilter.size > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {[...calFilter].sort().map((line) => {
                          const isPrsp = sortedCalLines.find(([l]) => l === line)?.[1]?.status === "prospect";
                          return (
                            <button key={line} onClick={() => toggleCalLine(line)} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: isPrsp ? "rgba(167,139,250,0.15)" : "rgba(71,85,105,0.15)",
                              border: `1px solid ${isPrsp ? PROSPECT_COLOR : OTHER_COLOR}`,
                              borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                            }}>
                              <span style={{ color: isPrsp ? PROSPECT_COLOR : TEXT_DIM, fontSize: 12, fontWeight: 500 }}>{line}</span>
                              <span style={{ color: isPrsp ? PROSPECT_COLOR : TEXT_DIM, fontSize: 14, lineHeight: 1 }}>×</span>
                            </button>
                          );
                        })}
                        <button onClick={() => setCalFilter(new Set())} style={{
                          background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`,
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11,
                          fontFamily: "JetBrains Mono",
                        }}>Clear all</button>
                      </div>
                    )}
                  </div>

                  {/* Right: summary stats */}
                  <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingTop: 20 }}>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(56,189,248,0.08)", borderRadius: 8, border: `1px solid rgba(56,189,248,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>IPS Calls</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{ipsThisMonth.length}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>{monthNames[calMonth]}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: `1px solid rgba(245,158,11,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>IPS (T)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: IPS_WARN, fontFamily: "JetBrains Mono" }}>{ipsT}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>turnarounds</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(71,85,105,0.08)", borderRadius: 8, border: `1px solid rgba(71,85,105,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Showing</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "JetBrains Mono" }}>{calFilter.size > 0 ? `+${calFilter.size}` : "IPS"}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>{calFilter.size > 0 ? "extra lines" : "only"}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calendar grid */}
              <Card style={{ padding: 12, overflow: "auto" }}>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {dayLabels.map((d) => (
                    <div key={d} style={{
                      textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5,
                      color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "6px 0",
                    }}>{d}</div>
                  ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                    {week.map((day, di) => {
                      if (day === null) return <div key={di} style={{ minHeight: 90 }} />;
                      const dateStr = `${year}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const allShips = dailyMap[dateStr] || [];
                      const ships = allShips.filter(calVisible);
                      const isWeekend = di >= 5;
                      const hasActivity = ships.length > 0;
                      const ipsTCount = ships.filter(s => isIPS(s) && s.turnaround).length;

                      return (
                        <div key={di} style={{
                          minHeight: 90,
                          background: hasActivity
                            ? ships.length >= 5 ? "rgba(239,68,68,0.06)" : ships.length >= 3 ? "rgba(245,158,11,0.04)" : "rgba(56,189,248,0.03)"
                            : isWeekend ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.015)",
                          border: `1px solid ${hasActivity && ships.length >= 4 ? "rgba(245,158,11,0.25)" : BORDER}`,
                          borderRadius: 8, padding: 6, position: "relative", overflow: "hidden",
                        }}>
                          {/* Day number header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{
                              fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700,
                              color: hasActivity ? TEXT : TEXT_DIM,
                              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                              borderRadius: 5,
                              background: ipsTCount > 0 ? "rgba(56,189,248,0.15)" : "transparent",
                            }}>{day}</span>
                            {ships.length > 0 && (
                              <span style={{
                                fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 600,
                                color: ships.length >= 5 ? IPS_DANGER : ships.length >= 3 ? IPS_WARN : TEXT_DIM,
                                background: ships.length >= 5 ? "rgba(239,68,68,0.12)" : ships.length >= 3 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)",
                                padding: "1px 5px", borderRadius: 3,
                              }}>{ships.length}</span>
                            )}
                          </div>

                          {/* Ship pills */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {ships.map((s, si) => {
                              const ips = isIPS(s);
                              const isPrsp = s.status === "prospect" && !wonLines.has(s.line);
                              const chipColor = ips ? IPS_ACCENT : isPrsp ? PROSPECT_COLOR : OTHER_COLOR;
                              const opsDate = getTurnaroundOpsDate(s);
                              const isOpsDay = opsDate === dateStr;
                              const isArrival = s.date === dateStr;
                              const isDeparture = s.endDate === dateStr;
                              const isMidStay = !isArrival && !isDeparture && s.endDate !== null;

                              return (
                                <div key={si} style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  background: `${chipColor}${ips ? "18" : "0D"}`,
                                  border: `1px solid ${isOpsDay && s.turnaround ? IPS_WARN + "60" : chipColor + "25"}`,
                                  borderRadius: 4, padding: "2px 5px",
                                  borderLeft: `3px solid ${chipColor}`,
                                }}>
                                  <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                                    {s.turnaround && <span style={{ fontSize: 7, color: IPS_WARN, fontWeight: 800, fontFamily: "JetBrains Mono" }}>T</span>}
                                    {isOpsDay && s.turnaround && <span style={{ fontSize: 8 }}>⚙</span>}
                                    {isArrival && s.endDate && <span style={{ fontSize: 7, color: IPS_SUCCESS, fontFamily: "JetBrains Mono", fontWeight: 700 }}>▶</span>}
                                    {isDeparture && <span style={{ fontSize: 7, color: IPS_DANGER, fontFamily: "JetBrains Mono", fontWeight: 700 }}>◀</span>}
                                    {isMidStay && <span style={{ fontSize: 7, color: PROSPECT_COLOR, fontFamily: "JetBrains Mono" }}>◆</span>}
                                  </div>
                                  <span style={{
                                    fontSize: 9, color: chipColor, fontWeight: ips ? 600 : 400,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1,
                                    opacity: isMidStay ? 0.6 : 1,
                                  }}>{s.ship}</span>
                                  <span style={{
                                    fontSize: 8, color: TEXT_DIM, fontFamily: "JetBrains Mono", flexShrink: 0,
                                    opacity: isMidStay ? 0.5 : 0.7,
                                  }}>{s.pax >= 1000 ? (s.pax / 1000).toFixed(1) + "k" : s.pax}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
                  display: "flex", flexWrap: "wrap", gap: 16, fontSize: 10, color: TEXT_DIM,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: IPS_ACCENT, display: "inline-block" }} /> IPS Contracted
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PROSPECT_COLOR, display: "inline-block" }} /> Prospect
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: OTHER_COLOR, display: "inline-block" }} /> Other
                  </span>
                  <span><strong style={{ color: IPS_WARN, fontFamily: "JetBrains Mono" }}>T</strong> = Turnaround</span>
                  <span>⚙ = Ops Day</span>
                  <span><span style={{ color: IPS_SUCCESS, fontFamily: "JetBrains Mono", fontWeight: 700 }}>▶</span> Arrival</span>
                  <span><span style={{ color: IPS_DANGER, fontFamily: "JetBrains Mono", fontWeight: 700 }}>◀</span> Departure</span>
                  <span><span style={{ color: PROSPECT_COLOR, fontFamily: "JetBrains Mono" }}>◆</span> Mid-stay</span>
                </div>
              </Card>
            </>
          );
        })()}

        {/* ═══ CRUNCH ═══ */}
        {activeView === "crunch" && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div><SL>Turnaround Crunch Calendar — IPS (T) Ops Days</SL><div style={{ fontSize: 12, color: TEXT_DIM, marginTop: -8 }}>Ops day: 2-night stays = middle day · 1-night = arrival day · Red = 2+ simultaneous</div></div>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ color: IPS_SUCCESS, label: "1 (T)" }, { color: IPS_WARN, label: "2 (T)" }, { color: IPS_DANGER, label: "3+ (T)" }].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT_DIM }}><div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}</div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
              {crunchData.map((d) => {
                const color = d.ipsTurnarounds >= 3 ? IPS_DANGER : d.ipsTurnarounds >= 2 ? IPS_WARN : IPS_SUCCESS;
                const isAlert = d.ipsTurnarounds >= 2;
                const dateObj = new Date(d.date + "T12:00:00");
                const totalCrew = d.ipsShips.reduce((sum, s) => sum + (s.pax / 1000) * CREW_PER_1000_PAX_TURNAROUND, 0);
                return (
                  <div key={d.date} style={{ background: isAlert ? `rgba(${color === IPS_DANGER ? "239,68,68" : "245,158,11"},0.08)` : "rgba(255,255,255,0.02)", border: `1px solid ${isAlert ? color : BORDER}`, borderRadius: 8, padding: 12, position: "relative" }}>
                    {isAlert && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: `${color}20`, color, padding: "2px 6px", borderRadius: 3, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{d.ipsTurnarounds >= 3 ? "Critical" : "Alert"}</div>}
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM, marginBottom: 4 }}>{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color, fontFamily: "JetBrains Mono" }}>{d.ipsTurnarounds}</div>
                      <div><span style={{ fontSize: 11, color: TEXT_DIM }}>(T) calls</span><div style={{ fontSize: 10, color: TEXT_DIM }}>~{Math.ceil(totalCrew)} crew</div></div>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                      {d.ipsShips.map((s, i) => {
                        const isMultiDay = s.endDate !== null;
                        const opsNote = isMultiDay ? (s.arrivalDate !== d.date ? `arr. ${new Date(s.arrivalDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "") : "";
                        return (
                          <div key={i} style={{ color: TEXT, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>⛴ {s.ship} {s.overnight ? "🌙" : ""}{opsNote ? <span style={{ fontSize: 9, color: TEXT_DIM, marginLeft: 4 }}>({opsNote})</span> : ""}</span>
                            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{s.pax}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 24, fontSize: 12, color: TEXT_DIM }}>
              <span>IPS (T) days: <strong style={{ color: IPS_ACCENT }}>{crunchData.length}</strong></span>
              <span>Alert (2+): <strong style={{ color: IPS_WARN }}>{crunchData.filter(d => d.ipsTurnarounds >= 2).length}</strong></span>
              <span>Critical (3+): <strong style={{ color: IPS_DANGER }}>{crunchData.filter(d => d.ipsTurnarounds >= 3).length}</strong></span>
            </div>
          </Card>
        )}

        {/* ═══ OPERATIONS ═══ */}
        {activeView === "operations" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            {stats.monthly.map((m) => (
              <Card key={m.month} onClick={() => setSelectedMonth(selectedMonth === m.month ? null : m.month)} style={{ cursor: "pointer", border: selectedMonth === m.month ? `1px solid ${IPS_ACCENT}` : `1px solid ${BORDER}`, background: selectedMonth === m.month ? "rgba(56,189,248,0.05)" : SURFACE }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>{m.month} 2026</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ v: m.ipsCalls, l: "IPS Calls", c: IPS_ACCENT }, { v: m.pallets, l: "Pallets", c: IPS_WARN }, { v: m.crew, l: "Peak Crew", c: IPS_SUCCESS }, { v: m.luggage, l: "Luggage", c: PROSPECT_COLOR }].map((x, i) => (
                    <div key={i}><div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono", color: x.c }}>{x.v}</div><div style={{ fontSize: 10, color: TEXT_DIM }}>{x.l}</div></div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          {selectedMonth && (
            <Card style={{ marginBottom: 20 }}>
              <SL>{selectedMonth} 2026 — IPS Ship Schedule</SL>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 70px 80px 50px 50px 80px", gap: 10, padding: "8px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                  <span>Dates</span><span>Line</span><span>Ship</span><span style={{ textAlign: "right" }}>Pax</span><span style={{ textAlign: "center" }}>Type</span><span style={{ textAlign: "center" }}>O/N</span><span style={{ textAlign: "center" }}>Tier</span><span style={{ textAlign: "right" }}>Pallets</span>
                </div>
                {SHIPS.filter((s) => MONTHS[MONTH_NUMS.indexOf(new Date(s.date).getMonth() + 1)] === selectedMonth && isIPS(s)).sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 70px 80px 50px 50px 80px", gap: 10, padding: "9px 12px", fontSize: 13, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderRadius: 4 }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: TEXT_DIM }}>{fmtDateRange(s)}</span>
                    <span style={{ fontWeight: 500 }}>{s.line}</span>
                    <span style={{ color: TEXT_DIM }}>{s.ship}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{s.pax.toLocaleString()}</span>
                    <span style={{ textAlign: "center" }}>{s.turnaround ? <span style={{ background: "rgba(245,158,11,0.15)", color: IPS_WARN, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 600 }}>(T)</span> : <span style={{ color: TEXT_DIM, fontSize: 11 }}>Transit</span>}</span>
                    <span style={{ textAlign: "center" }}>{isOvernight(s) ? <span style={{ fontSize: 13 }}>🌙</span> : <span style={{ color: TEXT_DIM }}>—</span>}</span>
                    <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 10, color: s.turnaround ? IPS_SUCCESS : TEXT_DIM }}>{s.turnaround ? getTierLabel(s.pax) : "1×"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 12 }}>{Math.round(s.pax * (s.turnaround ? PALLETS_PER_PAX_TURNAROUND : PALLETS_PER_PAX_TRANSIT))}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card><SL>Monthly Labor & Logistics Forecast</SL><ResponsiveContainer width="100%" height={250}><BarChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, color: TEXT_DIM }} /><Bar dataKey="pallets" name="Pallets" fill={IPS_ACCENT} radius={[4, 4, 0, 0]} /><Bar dataKey="luggage" name="Luggage" fill={IPS_WARN} radius={[4, 4, 0, 0]} /><Bar dataKey="crew" name="Peak Crew" fill={IPS_SUCCESS} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        </>)}

        {/* ═══ FLEET INTEL ═══ */}
        {activeView === "fleet" && (
          <Card>
            <SL>Cruise Line Intelligence — Reykjavík 2026 · {SHIPS.length} Port Calls</SL>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 55px 55px 55px 55px 70px 70px 70px", gap: 8, padding: "8px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                <span>Line</span><span>Status</span><span style={{ textAlign: "right" }}>Calls</span><span style={{ textAlign: "right" }}>(T)</span><span style={{ textAlign: "right" }}>Trn</span><span style={{ textAlign: "right" }}>O/N</span><span style={{ textAlign: "right" }}>Tiered</span><span style={{ textAlign: "right" }}>Call%</span><span style={{ textAlign: "right" }}>Tier%</span>
              </div>
              {sortedLines.map(([line, data], i) => {
                const sc = data.status === "contracted" ? IPS_ACCENT : data.status === "prospect" ? PROSPECT_COLOR : OTHER_COLOR;
                const sl = data.status === "contracted" && data.baseStatus !== "contracted" ? "What-If" : data.status === "contracted" ? "Contract" : data.status === "prospect" ? "Prospect" : "—";
                return (
                  <div key={line} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 55px 55px 55px 55px 70px 70px 70px", gap: 8, padding: "8px 12px", fontSize: 12, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderRadius: 4, borderLeft: `3px solid ${sc}` }}>
                    <span style={{ fontWeight: 600, fontSize: 11 }}>{line}</span>
                    <span><span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${sc}15`, color: sc, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase" }}>{sl}</span></span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{data.calls}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: data.turnarounds > 0 ? IPS_WARN : TEXT_DIM }}>{data.turnarounds || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{data.transits || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{data.overnights || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{data.tieredW}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{((data.calls / stats.totalCalls) * 100).toFixed(1)}%</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{((data.tieredW / stats.totalTieredW) * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8, background: "rgba(56,189,248,0.05)", border: `1px solid rgba(56,189,248,0.15)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 12, color: TEXT_DIM }}>
                <strong style={{ color: IPS_ACCENT }}>{Object.values(stats.lineBreakdown).filter(d => d.status === "contracted").length}</strong> contracted · <strong style={{ color: PROSPECT_COLOR }}>{wonLines.size}</strong> what-if · <strong style={{ color: OTHER_COLOR }}>{Object.values(stats.lineBreakdown).filter(d => d.status === "other").length}</strong> other
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 12 }}>IPS: <strong style={{ color: IPS_ACCENT }}>{stats.callShare}%</strong> calls · <strong style={{ color: IPS_WARN }}>{stats.simpleWShare}%</strong> simple · <strong style={{ color: IPS_SUCCESS }}>{stats.tieredShare}%</strong> tiered</div>
            </div>
          </Card>
        )}

        {/* ═══ PORT CALENDAR ═══ */}
        {activeView === "portcal" && (() => {
          // Build daily port activity map including multi-day stays
          const dailyMap = {};
          SHIPS.forEach((s) => {
            const start = new Date(s.date + "T12:00:00");
            const end = s.endDate ? new Date(s.endDate + "T12:00:00") : start;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const key = d.toISOString().split("T")[0];
              if (!dailyMap[key]) dailyMap[key] = [];
              dailyMap[key].push(s);
            }
          });
          // Filter by selected lines
          const filterActive = portCalFilter.size > 0;
          const filteredDaily = {};
          Object.entries(dailyMap).forEach(([date, ships]) => {
            const filtered = filterActive ? ships.filter((s) => portCalFilter.has(s.line)) : ships;
            if (filtered.length > 0) filteredDaily[date] = filtered;
          });
          // Sort by number of calls descending
          const sortedDays = Object.entries(filteredDaily).sort((a, b) => b[1].length - a[1].length);
          // All unique lines for the filter
          const allLines = [...new Set(SHIPS.map((s) => s.line))].sort((a, b) => a.localeCompare(b));
          const togglePortCalLine = (line) => {
            setPortCalFilter((prev) => {
              const next = new Set(prev);
              if (next.has(line)) next.delete(line); else next.add(line);
              return next;
            });
          };
          const maxCalls = sortedDays.length > 0 ? sortedDays[0][1].length : 1;

          return (
            <>
              {/* Filter bar */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: "1 1 400px", position: "relative" }}>
                    <SL>Filter by Cruise Line</SL>
                    <button onClick={() => setPortCalDropOpen(!portCalDropOpen)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${portCalDropOpen ? IPS_ACCENT : BORDER}`,
                      borderRadius: 8, padding: "10px 14px", cursor: "pointer", color: TEXT, fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <span style={{ color: portCalFilter.size > 0 ? TEXT : TEXT_DIM }}>
                        {portCalFilter.size === 0 ? "All lines (click to filter)" : `${portCalFilter.size} line${portCalFilter.size > 1 ? "s" : ""} selected`}
                      </span>
                      <span style={{ color: TEXT_DIM, fontSize: 18, transform: portCalDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                    </button>
                    {portCalDropOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                        background: SURFACE, border: `1px solid ${IPS_ACCENT}`, borderRadius: 8,
                        maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                      }}>
                        {/* Quick actions */}
                        <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
                          <button onClick={() => setPortCalFilter(new Set(allLines))} style={{ background: "rgba(56,189,248,0.1)", border: `1px solid rgba(56,189,248,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Select all</button>
                          <button onClick={() => setPortCalFilter(new Set())} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>Clear all</button>
                          <button onClick={() => { const ipsLines = [...new Set(SHIPS.filter(s => s.status === "contracted").map(s => s.line))]; setPortCalFilter(prev => { const next = new Set(prev); ipsLines.forEach(l => next.add(l)); return next; }); }} style={{ background: "rgba(56,189,248,0.1)", border: `1px solid rgba(56,189,248,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>+ IPS</button>
                          <button onClick={() => { const pLines = [...new Set(SHIPS.filter(s => s.status === "prospect").map(s => s.line))]; setPortCalFilter(prev => { const next = new Set(prev); pLines.forEach(l => next.add(l)); return next; }); }} style={{ background: "rgba(167,139,250,0.1)", border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: PROSPECT_COLOR, fontSize: 10, fontFamily: "JetBrains Mono" }}>+ Prospects</button>
                        </div>
                        {allLines.map((line) => {
                          const checked = portCalFilter.has(line);
                          const lineStatus = SHIPS.find(s => s.line === line)?.status || "other";
                          const sc = lineStatus === "contracted" ? IPS_ACCENT : lineStatus === "prospect" ? PROSPECT_COLOR : TEXT_DIM;
                          return (
                            <button key={line} onClick={() => togglePortCalLine(line)} style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 10,
                              padding: "7px 12px", border: "none", cursor: "pointer",
                              background: checked ? "rgba(56,189,248,0.06)" : "transparent",
                              borderLeft: `3px solid ${checked ? sc : "transparent"}`,
                            }}>
                              <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? sc : BORDER}`, background: checked ? sc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {checked && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                              </div>
                              <span style={{ color: checked ? TEXT : TEXT_DIM, fontSize: 12, fontWeight: 500, flex: 1, textAlign: "left" }}>{line}</span>
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${sc}15`, color: sc, fontFamily: "JetBrains Mono" }}>
                                {lineStatus === "contracted" ? "IPS" : lineStatus === "prospect" ? "PRSP" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Chips */}
                    {portCalFilter.size > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {[...portCalFilter].sort().map((line) => {
                          const lineStatus = SHIPS.find(s => s.line === line)?.status || "other";
                          const sc = lineStatus === "contracted" ? IPS_ACCENT : lineStatus === "prospect" ? PROSPECT_COLOR : OTHER_COLOR;
                          return (
                            <button key={line} onClick={() => togglePortCalLine(line)} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: `${sc}15`, border: `1px solid ${sc}40`, borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                            }}>
                              <span style={{ color: sc, fontSize: 11 }}>{line}</span>
                              <span style={{ color: sc, fontSize: 12 }}>×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 24 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{sortedDays.length}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>active days</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: IPS_WARN, fontFamily: "JetBrains Mono", marginTop: 4 }}>{maxCalls}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>peak calls/day</div>
                  </div>
                </div>
              </Card>

              {/* Day list */}
              <Card>
                <SL>All Port Days — Sorted by Activity ({filterActive ? `filtered: ${portCalFilter.size} lines` : "all lines"}) · ⚙ = turnaround ops day</SL>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 50px 1fr 60px 60px", gap: 10, padding: "8px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                    <span>Date</span><span style={{ textAlign: "center" }}>Ships</span><span>Vessels in Port</span><span style={{ textAlign: "center" }}>(T)</span><span style={{ textAlign: "center" }}>O/N</span>
                  </div>
                  {sortedDays.map(([date, ships], i) => {
                    const turnarounds = ships.filter(s => s.turnaround).length;
                    const overnights = ships.filter(s => s.endDate !== null).length;
                    const dateObj = new Date(date + "T12:00:00");
                    const barWidth = Math.max(8, (ships.length / maxCalls) * 100);
                    const hasIPS = ships.some(s => isIPS(s));
                    return (
                      <div key={date} style={{
                        borderBottom: `1px solid rgba(255,255,255,0.03)`,
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 50px 1fr 60px 60px", gap: 10, padding: "8px 12px", alignItems: "center" }}>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM }}>
                            {dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <div style={{ textAlign: "center" }}>
                            <div style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 6, fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 14,
                              background: ships.length >= 6 ? "rgba(239,68,68,0.15)" : ships.length >= 4 ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.1)",
                              color: ships.length >= 6 ? IPS_DANGER : ships.length >= 4 ? IPS_WARN : IPS_ACCENT,
                            }}>
                              {ships.length}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {ships.map((s, j) => {
                              const ips = isIPS(s);
                              const isProspect = s.status === "prospect";
                              const chipColor = ips ? IPS_ACCENT : isProspect ? PROSPECT_COLOR : OTHER_COLOR;
                              const opsDate = getTurnaroundOpsDate(s);
                              const isOpsDay = opsDate === date;
                              return (
                                <span key={j} style={{
                                  fontSize: 10, padding: "2px 6px", borderRadius: 3,
                                  background: `${chipColor}15`, color: chipColor, fontWeight: 500,
                                  border: `1px solid ${isOpsDay ? IPS_WARN : chipColor + "30"}`,
                                  whiteSpace: "nowrap",
                                }}>
                                  {s.ship}{s.turnaround ? " (T)" : ""}{isOpsDay && s.turnaround ? " ⚙" : ""}{s.endDate ? " 🌙" : ""}
                                </span>
                              );
                            })}
                          </div>
                          <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 12, color: turnarounds > 0 ? IPS_WARN : TEXT_DIM }}>
                            {turnarounds > 0 ? turnarounds : "—"}
                          </span>
                          <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 12, color: overnights > 0 ? PROSPECT_COLOR : TEXT_DIM }}>
                            {overnights > 0 ? overnights : "—"}
                          </span>
                        </div>
                        {/* Activity bar */}
                        <div style={{ padding: "0 12px 6px", display: "flex", gap: 2 }}>
                          {ships.map((s, j) => {
                            const ips = isIPS(s);
                            const isProspect = s.status === "prospect";
                            return (
                              <div key={j} style={{
                                height: 3, borderRadius: 2, flex: 1,
                                background: ips ? IPS_ACCENT : isProspect ? PROSPECT_COLOR : "rgba(255,255,255,0.08)",
                              }} />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {sortedDays.length === 0 && <div style={{ textAlign: "center", padding: 40, color: TEXT_DIM }}>No port days match the current filter.</div>}
              </Card>
            </>
          );
        })()}

        </>)}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* WORKSPACE MODULE                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeModule === "workspace" && (<>

          {/* TASK FORM MODAL */}
          {wsTaskModal !== null && (
            <div onClick={() => setWsTaskModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 480, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{wsTaskModal === "new" ? "New Task" : "Edit Task"}</div>
                  <button onClick={() => setWsTaskModal(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Title</div>
                    <input value={wsTaskForm.title} onChange={e => setWsTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title..." style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Description</div>
                    <textarea value={wsTaskForm.description} onChange={e => setWsTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Assignee</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(WS_TEAM).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, assignee: k }))} style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.assignee === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.assignee === k ? v.color : BORDER}`,
                          color: wsTaskForm.assignee === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 13,
                          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{ width: 24, height: 24, borderRadius: 12, background: `${v.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color }}>{v.initials}</span>
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Project</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(WS_PROJECTS).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, project: k }))} style={{
                          padding: "6px 14px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.project === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.project === k ? v.color : BORDER}`,
                          color: wsTaskForm.project === k ? v.color : TEXT_DIM, fontWeight: 500, fontSize: 12,
                          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Priority</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(WS_PRIORITIES).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, priority: k }))} style={{
                          flex: 1, padding: "8px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.priority === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.priority === k ? v.color : BORDER}`,
                          color: wsTaskForm.priority === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 12,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Due Date</div>
                    <input type="date" value={wsTaskForm.dueDate} onChange={e => setWsTaskForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setWsTaskModal(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                  <button onClick={saveTaskForm} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{wsTaskModal === "new" ? "Create Task" : "Save Changes"}</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TASKS VIEW ═══ */}
          {wsView === "tasks" && (<>
            {/* Action bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={openNewTask} style={{
                padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                background: `linear-gradient(135deg, ${IPS_ACCENT}, #0284C7)`,
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8,
              }}>+ New Task</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Sort:</span>
                {[["dueDate", "Due Date"], ["priority", "Priority"], ["createdAt", "Created"], ["title", "Title"]].map(([k, l]) => (
                  <FilterPill key={k} label={l} active={wsSortBy === k} onClick={() => { if (wsSortBy === k) setWsSortDir(d => d === "asc" ? "desc" : "asc"); else { setWsSortBy(k); setWsSortDir("asc"); } }} />
                ))}
                <button onClick={() => setWsSortDir(d => d === "asc" ? "desc" : "asc")} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 14, padding: "4px 6px" }}>{wsSortDir === "asc" ? "↑" : "↓"}</button>
              </div>
            </div>

            {/* Filter bar */}
            <Card style={{ marginBottom: 16, padding: 14 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Status:</span>
                  {[["all", "All"], ["active", "Active"], ["completed", "Done"]].map(([k, l]) => (
                    <FilterPill key={k} label={l} active={wsFilter.status === k} onClick={() => setWsFilter(f => ({ ...f, status: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Assignee:</span>
                  <FilterPill label="All" active={wsFilter.assignee === "all"} onClick={() => setWsFilter(f => ({ ...f, assignee: "all" }))} />
                  {Object.entries(WS_TEAM).map(([k, v]) => (
                    <FilterPill key={k} label={v.name} active={wsFilter.assignee === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, assignee: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Project:</span>
                  <FilterPill label="All" active={wsFilter.project === "all"} onClick={() => setWsFilter(f => ({ ...f, project: "all" }))} />
                  {Object.entries(WS_PROJECTS).map(([k, v]) => (
                    <FilterPill key={k} label={v.label} active={wsFilter.project === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, project: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Priority:</span>
                  <FilterPill label="All" active={wsFilter.priority === "all"} onClick={() => setWsFilter(f => ({ ...f, priority: "all" }))} />
                  {Object.entries(WS_PRIORITIES).map(([k, v]) => (
                    <FilterPill key={k} label={v.label} active={wsFilter.priority === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, priority: k }))} />
                  ))}
                </div>
              </div>
            </Card>

            {/* Task list */}
            {filteredTasks.length === 0 && (
              <Card style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>{wsTasks.length === 0 ? "No tasks yet. Create your first task to get started." : "No tasks match the current filters."}</div>
              </Card>
            )}
            {filteredTasks.map(task => {
              const proj = WS_PROJECTS[task.project] || WS_PROJECTS.general;
              const pri = WS_PRIORITIES[task.priority] || WS_PRIORITIES.medium;
              const assignee = WS_TEAM[task.assignee] || WS_TEAM.jon;
              const isExpanded = wsExpandedTask === task.id;
              const isOverdue = !task.completed && task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
              return (
                <div key={task.id} style={{ marginBottom: 6 }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "36px 1fr auto auto auto auto 60px",
                    gap: 12, alignItems: "center", padding: "12px 16px",
                    background: task.completed ? "rgba(255,255,255,0.01)" : SURFACE,
                    border: `1px solid ${isOverdue ? "rgba(239,68,68,0.4)" : BORDER}`,
                    borderRadius: isExpanded ? "8px 8px 0 0" : 8,
                    borderLeft: `3px solid ${pri.color}`,
                    opacity: task.completed ? 0.55 : 1, transition: "all 0.2s",
                  }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleComplete(task.id)} style={{
                      width: 24, height: 24, borderRadius: 6, cursor: "pointer",
                      background: task.completed ? `${IPS_SUCCESS}25` : "rgba(255,255,255,0.03)",
                      border: `2px solid ${task.completed ? IPS_SUCCESS : BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center", color: IPS_SUCCESS, fontSize: 14,
                    }}>{task.completed ? "✓" : ""}</button>

                    {/* Title + description */}
                    <div onClick={() => setWsExpandedTask(isExpanded ? null : task.id)} style={{ cursor: "pointer", minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? TEXT_DIM : TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.description}</div>}
                    </div>

                    {/* Project tag */}
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${proj.color}15`, color: proj.color, fontFamily: "JetBrains Mono", fontWeight: 600, whiteSpace: "nowrap" }}>{proj.label}</span>

                    {/* Assignee */}
                    <span style={{ width: 26, height: 26, borderRadius: 13, background: `${assignee.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, color: assignee.color, flexShrink: 0 }}>{assignee.initials}</span>

                    {/* Due date */}
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: isOverdue ? IPS_DANGER : task.dueDate ? TEXT_DIM : "transparent", whiteSpace: "nowrap" }}>
                      {task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                    </span>

                    {/* Notes count */}
                    <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textAlign: "center" }}>
                      {(task.notes?.length || 0) > 0 ? `💬${task.notes.length}` : ""}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEditTask(task)} style={{ background: "rgba(56,189,248,0.1)", border: `1px solid rgba(56,189,248,0.2)`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Edit</button>
                      <button onClick={() => deleteTask(task.id)} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>Del</button>
                    </div>
                  </div>

                  {/* Expanded notes panel */}
                  {isExpanded && (
                    <div style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: 16 }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 12 }}>Notes & Comments</div>
                      {(task.notes || []).length === 0 && <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>No notes yet.</div>}
                      {(task.notes || []).map(note => (
                        <div key={note.id} style={{ marginBottom: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: `3px solid ${(WS_TEAM[note.author] || WS_TEAM.jon).color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: (WS_TEAM[note.author] || WS_TEAM.jon).color }}>{(WS_TEAM[note.author] || WS_TEAM.jon).name}</span>
                            <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{new Date(note.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{note.text}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {Object.entries(WS_TEAM).map(([k, v]) => (
                            <button key={k} onClick={() => setWsNoteAuthor(k)} style={{
                              width: 28, height: 28, borderRadius: 14, cursor: "pointer",
                              background: wsNoteAuthor === k ? `${v.color}30` : "rgba(255,255,255,0.03)",
                              border: `2px solid ${wsNoteAuthor === k ? v.color : BORDER}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color,
                            }}>{v.initials}</button>
                          ))}
                        </div>
                        <input value={wsNewNote} onChange={e => setWsNewNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(task.id); }} placeholder="Add a note..." style={{ ...inputStyle, flex: 1, padding: "6px 12px" }} />
                        <button onClick={() => addNote(task.id)} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>)}

          {/* ═══ WORKSPACE CALENDAR ═══ */}
          {wsView === "calendar" && (() => {
            const year = wsCalYear;
            const monthIdx = wsCalMonth;
            const firstDay = new Date(year, monthIdx, 1);
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
            const weeks = [];
            let week = new Array(startDow).fill(null);
            for (let d = 1; d <= daysInMonth; d++) {
              week.push(d);
              if (week.length === 7) { weeks.push(week); week = []; }
            }
            if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
            const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const monthName = firstDay.toLocaleDateString("en-GB", { month: "long" });

            // Build task map by date
            const tasksByDate = {};
            wsTasks.forEach(t => {
              if (t.dueDate) {
                if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
                tasksByDate[t.dueDate].push(t);
              }
            });

            const prevMonth = () => {
              if (wsCalMonth === 0) { setWsCalMonth(11); setWsCalYear(y => y - 1); }
              else setWsCalMonth(m => m - 1);
            };
            const nextMonth = () => {
              if (wsCalMonth === 11) { setWsCalMonth(0); setWsCalYear(y => y + 1); }
              else setWsCalMonth(m => m + 1);
            };

            return (
              <>
                <Card style={{ marginBottom: 16, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: TEXT_DIM, fontSize: 16, fontFamily: "JetBrains Mono" }}>◀</button>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{monthName} {year}</div>
                    <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: TEXT_DIM, fontSize: 16, fontFamily: "JetBrains Mono" }}>▶</button>
                  </div>
                </Card>
                <Card style={{ padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                    {dayLabels.map(d => (
                      <div key={d} style={{ textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "6px 0" }}>{d}</div>
                    ))}
                  </div>
                  {weeks.map((wk, wi) => (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                      {wk.map((day, di) => {
                        if (day === null) return <div key={di} style={{ minHeight: 90 }} />;
                        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayTasks = tasksByDate[dateStr] || [];
                        const today = new Date().toISOString().split("T")[0];
                        const isToday = dateStr === today;
                        const isWeekend = di >= 5;
                        return (
                          <div key={di} style={{
                            minHeight: 90, borderRadius: 8, padding: 6, position: "relative",
                            background: isToday ? "rgba(56,189,248,0.06)" : dayTasks.length >= 3 ? "rgba(245,158,11,0.04)" : isWeekend ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.015)",
                            border: `1px solid ${isToday ? IPS_ACCENT + "50" : BORDER}`,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{
                                fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700,
                                color: isToday ? IPS_ACCENT : dayTasks.length > 0 ? TEXT : TEXT_DIM,
                                width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 5, background: isToday ? "rgba(56,189,248,0.15)" : "transparent",
                              }}>{day}</span>
                              {dayTasks.length > 0 && (
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 600, color: dayTasks.length >= 3 ? IPS_WARN : TEXT_DIM, background: dayTasks.length >= 3 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>{dayTasks.length}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {dayTasks.slice(0, 4).map(t => {
                                const p = WS_PROJECTS[t.project] || WS_PROJECTS.general;
                                const a = WS_TEAM[t.assignee] || WS_TEAM.jon;
                                return (
                                  <div key={t.id} onClick={() => openEditTask(t)} style={{
                                    display: "flex", alignItems: "center", gap: 3, cursor: "pointer",
                                    background: t.completed ? "rgba(255,255,255,0.02)" : `${p.color}0D`,
                                    border: `1px solid ${p.color}25`, borderRadius: 4, padding: "2px 5px",
                                    borderLeft: `3px solid ${p.color}`, opacity: t.completed ? 0.5 : 1,
                                  }}>
                                    <span style={{ width: 14, height: 14, borderRadius: 7, background: `${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontFamily: "JetBrains Mono", fontWeight: 700, color: a.color, flexShrink: 0 }}>{a.initials}</span>
                                    <span style={{ fontSize: 9, color: t.completed ? TEXT_DIM : TEXT, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                                  </div>
                                );
                              })}
                              {dayTasks.length > 4 && <div style={{ fontSize: 9, color: TEXT_DIM, textAlign: "center" }}>+{dayTasks.length - 4} more</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </Card>
              </>
            );
          })()}

          {/* ═══ WORKSPACE DASHBOARD ═══ */}
          {wsView === "dashboard" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { l: "Total Tasks", v: wsStats.total, c: TEXT },
                { l: "Active", v: wsStats.active, c: IPS_ACCENT },
                { l: "Completed", v: wsStats.done, c: IPS_SUCCESS },
                { l: "Overdue", v: wsStats.overdue, c: IPS_DANGER },
              ].map((x, i) => (
                <Card key={i}><div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: x.c, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>
                </div></Card>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Tasks by Project */}
              <Card>
                <SL>Tasks by Project</SL>
                {Object.entries(WS_PROJECTS).map(([k, v]) => {
                  const d = wsStats.byProject[k] || { total: 0, done: 0 };
                  const pct = d.total > 0 ? (d.done / d.total * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{v.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{d.done}/{d.total}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: v.color, width: `${pct}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </Card>

              {/* Tasks by Assignee */}
              <Card>
                <SL>Tasks by Assignee</SL>
                {Object.entries(WS_TEAM).map(([k, v]) => {
                  const d = wsStats.byAssignee[k] || { total: 0, done: 0 };
                  const pct = d.total > 0 ? (d.done / d.total * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 16, background: `${v.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color }}>{v.initials}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                            <div style={{ fontSize: 10, color: TEXT_DIM }}>{d.done} done · {d.total - d.done} remaining</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono", color: v.color }}>{d.total}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: v.color, width: `${pct}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            {wsTasks.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>Create some tasks to see your dashboard stats here.</div>
              </Card>
            )}
          </>)}

        </>)}

        {/* FOOTER */}
        <div style={{ marginTop: 24, padding: "16px 0", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT_DIM }}>
          <span>{activeModule === "market" ? "Source: DOKK portal · Corrected Feb 2026 · Tiered (T): <300p=1× · 300–600p=3× · 600–1200p=6× · 1200+p=11× · 🌙 = overnight" : "IPS Workspace · Shared task management for Jón & Tristan"}</span>
          <span style={{ fontFamily: "JetBrains Mono" }}>{activeModule === "market" ? "IPS Market Intelligence v3.0" : "IPS Workspace v1.0"}</span>
        </div>
      </div>
    </div>
  );
}
