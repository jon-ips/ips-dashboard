#!/usr/bin/env node
// Generate Samskip simple calendar PNGs: IPS contracted + all Samskip lines
// White background, big ship names, orange accent for Samskip entries
import { writeFileSync, mkdirSync } from "fs";
import { createCanvas } from "canvas";

// ── Samskip prospect lines ──────────────────────────────────────────────────
const SAMSKIP_LINES = new Set([
  "Oceania", "Norwegian Cruise Line", "Regent", "Carnival",
  "Peace Boat", "Princess", "Virgin",
]);

// ── IPS lines (former IPS contracted, excludes SDK calls) ───────────────────
const IPS_LINES = new Set([
  "Holland America", "Seabourn", "Viking",
]);

// ── Port calls data (same as main app) ──────────────────────────────────────
const SHIPS = [
  { date: "2026-05-04", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-08", endDate: null, line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-05-13", endDate: "2026-05-14", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-15", endDate: null, line: "Silversea", ship: "Silver Endeavour", turnaround: true, pax: 260, status: "other" },
  { date: "2026-05-19", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-20", endDate: "2026-05-21", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-05-22", endDate: null, line: "Carnival", ship: "Carnival Miracle", turnaround: false, pax: 2124, status: "other" },
  { date: "2026-05-23", endDate: null, line: "Hapag-Lloyd", ship: "Europa 2", turnaround: false, pax: 706, status: "contracted" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-05-24", endDate: "2026-05-25", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-05-26", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-05-27", endDate: "2026-05-28", line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-05-28", endDate: "2026-05-30", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-05-29", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-05-29", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-06-02", endDate: null, line: "Peace Boat", ship: "Pacific World", turnaround: false, pax: 1950, status: "other" },
  { date: "2026-06-02", endDate: null, line: "Hurtigruten", ship: "Fridtjof Nansen", turnaround: true, pax: 530, status: "other" },
  { date: "2026-06-03", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-06-06", endDate: null, line: "Seabourn", ship: "Seabourn Ovation", turnaround: true, pax: 604, status: "contracted" },
  { date: "2026-06-07", endDate: "2026-06-08", line: "Celebrity", ship: "Celebrity Eclipse", turnaround: false, pax: 2852, status: "other" },
  { date: "2026-06-07", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-06-08", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-08", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "contracted" },
  { date: "2026-06-08", endDate: "2026-06-09", line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-06-10", endDate: "2026-06-11", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
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
  { date: "2026-06-25", endDate: null, line: "Oceania", ship: "Vista", turnaround: false, pax: 1200, status: "other" },
  { date: "2026-06-25", endDate: "2026-06-26", line: "P&O", ship: "Aurora", turnaround: false, pax: 1868, status: "contracted" },
  { date: "2026-06-25", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-06-25", endDate: null, line: "VIVA Cruises", ship: "Seaventure", turnaround: true, pax: 164, status: "other" },
  { date: "2026-06-26", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "contracted" },
  { date: "2026-06-28", endDate: null, line: "Quark Expeditions", ship: "Ocean Nova", turnaround: true, pax: 78, status: "other" },
  { date: "2026-06-29", endDate: "2026-06-30", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-06-30", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-01", endDate: null, line: "Ponant", ship: "Le Commandant Charcot", turnaround: true, pax: 250, status: "other" },
  { date: "2026-07-01", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-01", endDate: "2026-07-02", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-07-02", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Spirit", turnaround: false, pax: 230, status: "contracted" },
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
  { date: "2026-07-08", endDate: "2026-07-09", line: "P&O", ship: "Britannia", turnaround: false, pax: 3647, status: "contracted" },
  { date: "2026-07-08", endDate: null, line: "Princess", ship: "Crown Princess", turnaround: false, pax: 3599, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-09", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-07-09", endDate: "2026-07-10", line: "Aida", ship: "AIDAsol", turnaround: false, pax: 2194, status: "contracted" },
  { date: "2026-07-10", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-07-10", endDate: "2026-07-11", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-07-11", endDate: "2026-07-12", line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "other" },
  { date: "2026-07-11", endDate: null, line: "Scenic", ship: "Scenic Eclipse", turnaround: true, pax: 228, status: "other" },
  { date: "2026-07-11", endDate: null, line: "Aurora Expeditions", ship: "Greg Mortimer", turnaround: true, pax: 160, status: "other" },
  { date: "2026-07-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-07-13", endDate: "2026-07-14", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-07-13", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Nat Geo", ship: "Nat Geo Resolution", turnaround: true, pax: 148, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "other" },
  { date: "2026-07-14", endDate: null, line: "Silversea", ship: "Silver Wind", turnaround: true, pax: 302, status: "other" },
  { date: "2026-07-15", endDate: null, line: "TUI", ship: "Mein Schiff 3", turnaround: false, pax: 2506, status: "contracted" },
  { date: "2026-07-16", endDate: null, line: "Seabourn", ship: "Seabourn Venture", turnaround: true, pax: 250, status: "contracted" },
  { date: "2026-07-16", endDate: "2026-07-17", line: "Regent", ship: "Seven Seas Mariner", turnaround: true, pax: 700, status: "other" },
  { date: "2026-07-17", endDate: null, line: "Costa", ship: "Costa Favolosa", turnaround: false, pax: 3016, status: "contracted" },
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
  { date: "2026-07-27", endDate: "2026-07-29", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-07-29", endDate: "2026-07-30", line: "Holland America", ship: "Zuiderdam", turnaround: false, pax: 2272, status: "contracted" },
  { date: "2026-07-30", endDate: null, line: "Victory Cruise Lines", ship: "Ocean Victory", turnaround: true, pax: 186, status: "other" },
  { date: "2026-07-30", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-07-31", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-01", endDate: null, line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-01", endDate: null, line: "Regent", ship: "Seven Seas Grandeur", turnaround: true, pax: 809, status: "other" },
  { date: "2026-08-02", endDate: null, line: "Nat Geo", ship: "Nat Geo Explorer", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-02", endDate: "2026-08-03", line: "Cunard", ship: "Queen Anne", turnaround: false, pax: 2650, status: "contracted" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-03", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-03", endDate: "2026-08-04", line: "Oceania", ship: "Insignia", turnaround: true, pax: 684, status: "other" },
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
  { date: "2026-08-09", endDate: null, line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-09", endDate: null, line: "Swan Hellenic", ship: "SH Diana", turnaround: true, pax: 192, status: "other" },
  { date: "2026-08-09", endDate: "2026-08-10", line: "P&O", ship: "Arcadia", turnaround: false, pax: 1994, status: "contracted" },
  { date: "2026-08-10", endDate: null, line: "Viking", ship: "Viking Mars", turnaround: true, pax: 930, status: "contracted" },
  { date: "2026-08-10", endDate: null, line: "Albatros Expeditions", ship: "Ocean Albatros", turnaround: true, pax: 189, status: "other" },
  { date: "2026-08-10", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-10", endDate: "2026-08-11", line: "Fred Olsen", ship: "Balmoral", turnaround: false, pax: 1747, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Atlas Ocean Voyages", ship: "World Navigator", turnaround: true, pax: 196, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Plantours", ship: "Hamburg", turnaround: false, pax: 420, status: "other" },
  { date: "2026-08-11", endDate: null, line: "Fred Olsen", ship: "Bolette", turnaround: false, pax: 1380, status: "other" },
  { date: "2026-08-11", endDate: "2026-08-12", line: "Aida", ship: "AIDAbella", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-08-12", endDate: "2026-08-13", line: "Cunard", ship: "Queen Mary 2", turnaround: false, pax: 2691, status: "contracted" },
  { date: "2026-08-12", endDate: null, line: "Aida", ship: "AIDAluna", turnaround: false, pax: 2050, status: "contracted" },
  { date: "2026-08-13", endDate: null, line: "Oceania", ship: "Marina", turnaround: true, pax: 1285, status: "other" },
  { date: "2026-08-14", endDate: null, line: "Ambassador", ship: "Ambition", turnaround: false, pax: 1196, status: "contracted" },
  { date: "2026-08-14", endDate: null, line: "Holland America", ship: "Nieuw Statendam", turnaround: false, pax: 2650, status: "contracted" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Celebrity", ship: "Celebrity Silhouette", turnaround: true, pax: 2886, status: "other" },
  { date: "2026-08-14", endDate: "2026-08-15", line: "Swan Hellenic", ship: "SH Vega", turnaround: true, pax: 152, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Virgin", ship: "Valiant Lady", turnaround: false, pax: 2770, status: "other" },
  { date: "2026-08-15", endDate: null, line: "Hapag-Lloyd", ship: "Hanseatic Nature", turnaround: true, pax: 200, status: "contracted" },
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
  { date: "2026-08-18", endDate: "2026-08-20", line: "TUI", ship: "Mein Schiff 2", turnaround: false, pax: 2894, status: "contracted" },
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
  { date: "2026-08-26", endDate: null, line: "Phoenix Reisen", ship: "Amera", turnaround: false, pax: 835, status: "contracted" },
  { date: "2026-08-27", endDate: null, line: "Nat Geo", ship: "Nat Geo Endurance", turnaround: true, pax: 148, status: "other" },
  { date: "2026-08-27", endDate: "2026-08-28", line: "MSC", ship: "MSC Preziosa", turnaround: false, pax: 3502, status: "other" },
  { date: "2026-08-29", endDate: null, line: "Aida", ship: "AIDAdiva", turnaround: false, pax: 1025, status: "contracted" },
  { date: "2026-08-29", endDate: "2026-08-30", line: "TUI", ship: "Mein Schiff 1", turnaround: false, pax: 2894, status: "contracted" },
  { date: "2026-08-30", endDate: null, line: "Quark Expeditions", ship: "Ultramarine", turnaround: true, pax: 199, status: "other" },
  { date: "2026-08-30", endDate: "2026-08-31", line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-08-31", endDate: null, line: "Hurtigruten", ship: "Spitsbergen", turnaround: true, pax: 335, status: "other" },
  { date: "2026-08-31", endDate: null, line: "Windstar", ship: "Star Pride", turnaround: true, pax: 212, status: "other" },
  { date: "2026-08-31", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "contracted" },
  { date: "2026-09-01", endDate: null, line: "Viking", ship: "Viking Mira", turnaround: true, pax: 990, status: "contracted" },
  { date: "2026-09-01", endDate: null, line: "Phoenix Reisen", ship: "Artania", turnaround: false, pax: 1176, status: "contracted" },
  { date: "2026-09-02", endDate: "2026-09-03", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: true, pax: 2348, status: "other" },
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
  { date: "2026-09-18", endDate: "2026-09-19", line: "Norwegian Cruise Line", ship: "Norwegian Star", turnaround: false, pax: 2348, status: "other" },
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

// ── Ops date logic (same as app) ────────────────────────────────────────────
function getTurnaroundOpsDate(s) {
  if (!s.turnaround) return null;
  if (!s.endDate) return s.date;
  const start = new Date(s.date + "T12:00:00");
  const end = new Date(s.endDate + "T12:00:00");
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  if (nights >= 2) {
    const mid = new Date(start);
    mid.setDate(mid.getDate() + 1);
    return mid.toISOString().split("T")[0];
  }
  return s.date;
}

function getNonTurnaroundOpsDate(s) {
  if (s.turnaround) return null;
  return s.date;
}

// ── Build ops-day data: IPS contracted + Samskip lines ──────────────────────
function buildSamskipOpsData() {
  const allDates = {};
  for (const s of SHIPS) {
    const isIPS = s.status === "contracted" && IPS_LINES.has(s.line);
    const isSamskip = SAMSKIP_LINES.has(s.line);
    if (!isIPS && !isSamskip) continue;

    let opsDate;
    if (s.turnaround) {
      opsDate = getTurnaroundOpsDate(s);
    } else {
      opsDate = getNonTurnaroundOpsDate(s);
    }
    if (!opsDate) continue;
    if (!allDates[opsDate]) allDates[opsDate] = [];
    allDates[opsDate].push({ ship: s.ship, turnaround: s.turnaround, pax: s.pax, line: s.line, isSamskip });
  }
  return allDates;
}

// ── Canvas-based calendar rendering ─────────────────────────────────────────
function generateMonthPNG(year, month, opsData) {
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const totalSlots = startDow + daysInMonth;
  const rows = Math.ceil(totalSlots / 7);

  // Layout constants
  const colW = 260;
  const headerH = 90; // extra room for subtitle
  const dayHeaderH = 40;
  const shipEntryH = 52;
  const dayCellPadTop = 38;
  const dayCellPadBot = 10;
  const minCellH = 100;

  // Pre-calculate cell heights
  const cellHeights = [];
  for (let row = 0; row < rows; row++) {
    let maxH = minCellH;
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      const day = idx - startDow + 1;
      if (day < 1 || day > daysInMonth) continue;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const ships = opsData[dateStr] || [];
      const needed = dayCellPadTop + Math.max(ships.length * shipEntryH, 10) + dayCellPadBot;
      if (needed > maxH) maxH = needed;
    }
    cellHeights.push(maxH);
  }

  const totalH = headerH + dayHeaderH + cellHeights.reduce((a, b) => a + b, 0) + 20;
  const totalW = colW * 7 + 20;

  const canvas = createCanvas(totalW, totalH);
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, totalW, totalH);

  // Month title
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "900 38px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${monthNames[month]} ${year}`, totalW / 2, 42);

  // Subtitle
  ctx.fillStyle = "#F97316";
  ctx.font = "700 14px 'Inter', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("SAMSKIP CALENDAR — IPS Contracted + Samskip Lines", totalW / 2, 64);

  // Legend
  ctx.textAlign = "left";
  const legendY = 80;
  const legendX = totalW / 2 - 200;
  // IPS box
  ctx.fillStyle = "#FFF7ED";
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 2;
  roundRect(ctx, legendX, legendY - 10, 12, 12, 3);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#888";
  ctx.font = "600 11px 'Inter', sans-serif";
  ctx.fillText("IPS Contracted", legendX + 18, legendY);
  // Samskip box
  ctx.fillStyle = "#FFF2E8";
  ctx.strokeStyle = "#F97316";
  roundRect(ctx, legendX + 130, legendY - 10, 12, 12, 3);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#888";
  ctx.fillText("Samskip Prospect", legendX + 148, legendY);

  // Day-of-week headers
  const gridX = 10;
  const gridY = headerH;
  for (let c = 0; c < 7; c++) {
    const x = gridX + c * colW;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, gridY, colW, dayHeaderH);
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, gridY, colW, dayHeaderH);
    ctx.fillStyle = "#555";
    ctx.font = "700 15px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayNames[c], x + colW / 2, gridY + 27);
  }

  // Day cells
  let yOff = gridY + dayHeaderH;
  for (let row = 0; row < rows; row++) {
    const rowH = cellHeights[row];
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      const day = idx - startDow + 1;
      const x = gridX + col * colW;
      const isValid = day >= 1 && day <= daysInMonth;

      // Cell background
      ctx.fillStyle = isValid ? "white" : "#fafafa";
      ctx.fillRect(x, yOff, colW, rowH);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, yOff, colW, rowH);

      if (!isValid) continue;

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const ships = opsData[dateStr] || [];

      // Day number
      const hasOps = ships.length > 0;
      ctx.textAlign = "left";
      ctx.fillStyle = hasOps ? "#1a1a1a" : "#aaa";
      ctx.font = `${hasOps ? "900" : "400"} 18px 'Inter', sans-serif`;
      ctx.fillText(String(day), x + 10, yOff + 24);

      // Ship entries
      let shipY = yOff + dayCellPadTop;
      for (const ship of ships) {
        const isTurnaround = ship.turnaround;
        const label = isTurnaround ? "TURNAROUND" : "GARBAGE";
        const entryH = shipEntryH - 4;

        let bgColor, borderColor, labelColor;
        if (ship.isSamskip) {
          bgColor = "#FFF2E8";
          borderColor = "#F97316";
          labelColor = "#C2410C";
        } else {
          bgColor = isTurnaround ? "#FFF7ED" : "#F0FDFA";
          borderColor = isTurnaround ? "#F59E0B" : "#458CA7";
          labelColor = isTurnaround ? "#D97706" : "#0F766E";
        }

        // Entry background
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        roundRect(ctx, x + 6, shipY, colW - 12, entryH, 6);
        ctx.fill();
        ctx.stroke();

        // Samskip label (small, top-right)
        if (ship.isSamskip) {
          ctx.textAlign = "right";
          ctx.fillStyle = "#F97316";
          ctx.font = "700 8px 'Inter', sans-serif";
          ctx.fillText("SAMSKIP", x + colW - 14, shipY + 12);
        }

        // Ship name
        ctx.textAlign = "left";
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "900 14px 'Inter', sans-serif";
        ctx.fillText(ship.ship, x + 14, shipY + 19);

        // Operation label
        ctx.fillStyle = labelColor;
        ctx.font = "900 16px 'Inter', sans-serif";
        ctx.fillText(label, x + 14, shipY + 38);

        // Pax on the right
        ctx.textAlign = "right";
        ctx.fillStyle = "#888";
        ctx.font = "400 11px 'Inter', sans-serif";
        ctx.fillText(`${ship.pax} pax`, x + colW - 16, shipY + 19);

        shipY += shipEntryH;
      }
    }
    yOff += rowH;
  }

  return canvas.toBuffer("image/png");
}

// Rounded rect helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Main ────────────────────────────────────────────────────────────────────
mkdirSync("calendars", { recursive: true });
const opsData = buildSamskipOpsData();
const months = [
  { num: 5, name: "May" },
  { num: 6, name: "June" },
  { num: 7, name: "July" },
  { num: 8, name: "August" },
  { num: 9, name: "September" },
];

for (const m of months) {
  const png = generateMonthPNG(2026, m.num, opsData);
  const path = `calendars/Samskip-${m.name}-2026.png`;
  writeFileSync(path, png);
  console.log(`Generated ${path}`);
}
console.log("Done! Samskip calendar PNGs in ./calendars/");
