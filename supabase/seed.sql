-- ============================================================================
-- Seed Data for IPS Dashboard
-- Icelandic Port Services
--
-- Populates cruise_lines, ships, and port_calls tables with the 2026 season
-- schedule data. Uses ON CONFLICT DO NOTHING to make the script idempotent.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CRUISE LINES
-- ============================================================================
INSERT INTO cruise_lines (name, status) VALUES
    ('Ponant',                  'other'),
    ('Fred Olsen',              'other'),
    ('Silversea',               'other'),
    ('Hurtigruten',             'other'),
    ('Norwegian Cruise Line',   'prospect'),
    ('Carnival',                'other'),
    ('Hapag-Lloyd',             'contracted'),
    ('VIVA Cruises',            'other'),
    ('MSC',                     'other'),
    ('TUI',                     'contracted'),
    ('Swan Hellenic',           'other'),
    ('Aurora Expeditions',      'other'),
    ('Peace Boat',              'other'),
    ('Seabourn',                'contracted'),
    ('Celebrity',               'other'),
    ('Nat Geo',                 'other'),
    ('Ambassador',              'contracted'),
    ('Aida',                    'contracted'),
    ('Viking',                  'contracted'),
    ('Nicko Cruises',           'other'),
    ('Princess',                'other'),
    ('Oceania',                 'prospect'),
    ('P&O',                     'contracted'),
    ('Phoenix Reisen',          'contracted'),
    ('Quark Expeditions',       'other'),
    ('Holland America',         'contracted'),
    ('Windstar',                'prospect'),
    ('Regent',                  'prospect'),
    ('Scenic',                  'other'),
    ('Costa',                   'contracted'),
    ('Saga',                    'other'),
    ('Victory Cruise Lines',    'other'),
    ('SunStone Ships',          'other'),
    ('Cunard',                  'other'),
    ('Azamara',                 'other'),
    ('Ritz-Carlton',            'other'),
    ('Atlas Ocean Voyages',     'other'),
    ('Virgin',                  'other'),
    ('Albatros Expeditions',    'other'),
    ('Poseidon Expeditions',    'other'),
    ('Plantours',               'other'),
    ('Explora Journeys',        'other')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 2. SHIPS
-- ============================================================================
INSERT INTO ships (name, cruise_line_id, pax_capacity)
SELECT v.ship_name, cl.id, v.pax
FROM (VALUES
    ('Le Commandant Charcot',   'Ponant',                   250),
    ('Balmoral',                'Fred Olsen',               1747),
    ('Silver Endeavour',        'Silversea',                260),
    ('Fridtjof Nansen',         'Hurtigruten',              530),
    ('Norwegian Star',          'Norwegian Cruise Line',    2348),
    ('Carnival Miracle',        'Carnival',                 2124),
    ('Europa 2',                'Hapag-Lloyd',              706),
    ('Seaventure',              'VIVA Cruises',             164),
    ('MSC Preziosa',            'MSC',                      3502),
    ('Mein Schiff 2',           'TUI',                      2894),
    ('SH Vega',                 'Swan Hellenic',            152),
    ('Greg Mortimer',           'Aurora Expeditions',       160),
    ('Pacific World',           'Peace Boat',               1950),
    ('Seabourn Ovation',        'Seabourn',                 604),
    ('Celebrity Eclipse',       'Celebrity',                2852),
    ('Nat Geo Explorer',        'Nat Geo',                  148),
    ('Ambition',                'Ambassador',               1196),
    ('AIDAluna',                'Aida',                     2050),
    ('Viking Neptune',          'Viking',                   930),
    ('Viking Mars',             'Viking',                   930),
    ('Vasco da Gama',           'Nicko Cruises',            1258),
    ('Majestic Princess',       'Princess',                 3560),
    ('Vista',                   'Oceania',                  1200),
    ('Aurora',                  'P&O',                      1868),
    ('Nat Geo Resolution',      'Nat Geo',                  148),
    ('Artania',                 'Phoenix Reisen',           1176),
    ('Ocean Nova',              'Quark Expeditions',        78),
    ('Nat Geo Endurance',       'Nat Geo',                  148),
    ('Scenic Eclipse',          'Scenic',                   228),
    ('MSC Virtuosa',            'MSC',                      6297),
    ('Rotterdam',               'Holland America',          2106),
    ('Hanseatic Nature',        'Hapag-Lloyd',              200),
    ('Ambience',                'Ambassador',               1596),
    ('Silver Wind',             'Silversea',                302),
    ('AIDAsol',                 'Aida',                     2194),
    ('Hanseatic Spirit',        'Hapag-Lloyd',              230),
    ('Borealis',                'Fred Olsen',               1360),
    ('Carnival Legend',          'Carnival',                 2124),
    ('Celebrity Silhouette',    'Celebrity',                2886),
    ('Spirit of Discovery',     'Saga',                     999),
    ('Volendam',                'Holland America',          1432),
    ('Star Pride',              'Windstar',                 212),
    ('Sky Princess',            'Princess',                 3560),
    ('Britannia',               'P&O',                      3647),
    ('Crown Princess',          'Princess',                 3599),
    ('Bolette',                 'Fred Olsen',               1380),
    ('Seven Seas Grandeur',     'Regent',                   809),
    ('Mein Schiff 3',           'TUI',                      2506),
    ('Seabourn Venture',        'Seabourn',                 250),
    ('Seven Seas Mariner',      'Regent',                   700),
    ('Costa Favolosa',          'Costa',                    3016),
    ('Viking Vela',             'Viking',                   998),
    ('Insignia',                'Oceania',                  684),
    ('Ultramarine',             'Quark Expeditions',        199),
    ('Ocean Victory',           'Victory Cruise Lines',     186),
    ('SH Diana',                'Swan Hellenic',            192),
    ('Queen Anne',              'Cunard',                   2650),
    ('Viking Saturn',           'Viking',                   930),
    ('Ocean Explorer',          'SunStone Ships',           140),
    ('Azamara Journey',         'Azamara',                  676),
    ('World Voyager',           'Atlas Ocean Voyages',      196),
    ('Sylvia Earle',            'Aurora Expeditions',       152),
    ('Arcadia',                 'P&O',                      1994),
    ('Ocean Albatros',          'Albatros Expeditions',     189),
    ('Evrima',                  'Ritz-Carlton',             298),
    ('Mein Schiff 7',           'TUI',                      2894),
    ('Valiant Lady',            'Virgin',                   2770),
    ('Spitsbergen',             'Hurtigruten',              335),
    ('Sea Spirit',              'Poseidon Expeditions',     114),
    ('AIDAbella',               'Aida',                     2050),
    ('Queen Mary 2',            'Cunard',                   2691),
    ('Marina',                  'Oceania',                  1285),
    ('Nieuw Statendam',         'Holland America',          2650),
    ('Seven Seas Voyager',      'Regent',                   700),
    ('Amera',                   'Phoenix Reisen',           835),
    ('AIDAdiva',                'Aida',                     1025),
    ('Viking Mira',             'Viking',                   990),
    ('Mein Schiff 1',           'TUI',                      2894),
    ('World Navigator',         'Atlas Ocean Voyages',      196),
    ('Renaissance',             'Regent',                   694),
    ('Ocean Adventurer',        'SunStone Ships',           132),
    ('Hamburg',                 'Plantours',                420),
    ('Fram',                    'Hurtigruten',              318),
    ('Zuiderdam',               'Holland America',          2272),
    ('Explora 3',               'Explora Journeys',         962),
    ('Ocean Albatros',          'Albatros Expeditions',     189)
) AS v(ship_name, cruise_line_name, pax)
JOIN cruise_lines cl ON cl.name = v.cruise_line_name
ON CONFLICT (name, cruise_line_id) DO NOTHING;


-- ============================================================================
-- 3. PORT CALLS
-- ============================================================================
-- Uses a CTE to resolve ship_id from ship name + cruise line name.
-- Each row: (date, end_date, cruise_line_name, ship_name, turnaround, pax, status)
-- ============================================================================

WITH port_call_data (arrival, departure, cruise_line_name, ship_name, turnaround, pax, status) AS (
    VALUES
    -- ===== MAY 2026 =====
    ('2026-05-04'::date, NULL::date,        'Ponant',                   'Le Commandant Charcot',    true,   250,    'other'),
    ('2026-05-08'::date, NULL,              'Fred Olsen',               'Balmoral',                 false,  1747,   'other'),
    ('2026-05-13'::date, '2026-05-14'::date,'Ponant',                   'Le Commandant Charcot',    true,   250,    'other'),
    ('2026-05-15'::date, NULL,              'Silversea',                'Silver Endeavour',         true,   260,    'other'),
    ('2026-05-19'::date, NULL,              'Hurtigruten',              'Fridtjof Nansen',          true,   530,    'other'),
    ('2026-05-20'::date, '2026-05-21'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-05-22'::date, NULL,              'Carnival',                 'Carnival Miracle',         false,  2124,   'other'),
    ('2026-05-23'::date, NULL,              'Hapag-Lloyd',              'Europa 2',                 false,  706,    'contracted'),
    ('2026-05-24'::date, '2026-05-25'::date,'VIVA Cruises',             'Seaventure',               true,   164,    'other'),
    ('2026-05-24'::date, '2026-05-25'::date,'MSC',                      'MSC Preziosa',             false,  3502,   'other'),
    ('2026-05-26'::date, NULL,              'Hurtigruten',              'Fridtjof Nansen',          true,   530,    'other'),
    ('2026-05-27'::date, '2026-05-28'::date,'Ponant',                   'Le Commandant Charcot',    true,   250,    'other'),
    ('2026-05-28'::date, '2026-05-30'::date,'TUI',                      'Mein Schiff 2',            false,  2894,   'contracted'),
    ('2026-05-29'::date, NULL,              'Swan Hellenic',            'SH Vega',                  true,   152,    'other'),
    ('2026-05-29'::date, NULL,              'Aurora Expeditions',       'Greg Mortimer',            true,   160,    'other'),

    -- ===== JUNE 2026 =====
    ('2026-06-02'::date, NULL,              'Peace Boat',               'Pacific World',            false,  1950,   'other'),
    ('2026-06-02'::date, NULL,              'Hurtigruten',              'Fridtjof Nansen',          true,   530,    'other'),
    ('2026-06-03'::date, NULL,              'VIVA Cruises',             'Seaventure',               true,   164,    'other'),
    ('2026-06-06'::date, NULL,              'Seabourn',                 'Seabourn Ovation',         true,   604,    'contracted'),
    ('2026-06-07'::date, '2026-06-08'::date,'Celebrity',                'Celebrity Eclipse',        false,  2852,   'other'),
    ('2026-06-07'::date, NULL,              'Aurora Expeditions',       'Greg Mortimer',            true,   160,    'other'),
    ('2026-06-08'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-06-08'::date, NULL,              'Ambassador',               'Ambition',                 false,  1196,   'contracted'),
    ('2026-06-08'::date, '2026-06-09'::date,'Aida',                     'AIDAluna',                 false,  2050,   'contracted'),
    ('2026-06-10'::date, '2026-06-11'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-06-13'::date, '2026-06-14'::date,'MSC',                      'MSC Virtuosa',             false,  6297,   'other'),
    ('2026-06-14'::date, NULL,              'Scenic',                   'Scenic Eclipse',           true,   228,    'other'),
    ('2026-06-14'::date, NULL,              'Holland America',          'Rotterdam',                true,   2106,   'contracted'),
    ('2026-06-15'::date, '2026-06-16'::date,'MSC',                      'MSC Preziosa',             false,  3502,   'other'),
    ('2026-06-16'::date, NULL,              'Hapag-Lloyd',              'Hanseatic Nature',         true,   200,    'contracted'),
    ('2026-06-17'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-06-17'::date, '2026-06-18'::date,'Ambassador',               'Ambience',                 false,  1596,   'contracted'),
    ('2026-06-18'::date, NULL,              'Silversea',                'Silver Wind',              true,   302,    'other'),
    ('2026-06-18'::date, '2026-06-19'::date,'Aida',                     'AIDAsol',                  false,  2194,   'contracted'),
    ('2026-06-20'::date, NULL,              'Viking',                   'Viking Neptune',           true,   930,    'contracted'),
    ('2026-06-21'::date, '2026-06-23'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-06-21'::date, '2026-06-22'::date,'Nicko Cruises',            'Vasco da Gama',            false,  1258,   'other'),
    ('2026-06-21'::date, '2026-06-22'::date,'TUI',                      'Mein Schiff 2',            false,  2894,   'contracted'),
    ('2026-06-23'::date, NULL,              'Princess',                 'Majestic Princess',        false,  3560,   'other'),
    ('2026-06-24'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-06-25'::date, NULL,              'Oceania',                  'Vista',                    false,  1200,   'prospect'),
    ('2026-06-25'::date, '2026-06-26'::date,'P&O',                      'Aurora',                   false,  1868,   'contracted'),
    ('2026-06-25'::date, NULL,              'Nat Geo',                  'Nat Geo Resolution',       true,   148,    'other'),
    ('2026-06-25'::date, NULL,              'VIVA Cruises',             'Seaventure',               true,   164,    'other'),
    ('2026-06-26'::date, NULL,              'Phoenix Reisen',           'Artania',                  false,  1176,   'contracted'),
    ('2026-06-28'::date, NULL,              'Quark Expeditions',        'Ocean Nova',               true,   78,     'other'),
    ('2026-06-29'::date, '2026-06-30'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-06-30'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),

    -- ===== JULY 2026 =====
    ('2026-07-01'::date, NULL,              'Ponant',                   'Le Commandant Charcot',    true,   250,    'other'),
    ('2026-07-01'::date, NULL,              'Scenic',                   'Scenic Eclipse',           true,   228,    'other'),
    ('2026-07-01'::date, '2026-07-02'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-07-02'::date, NULL,              'Hapag-Lloyd',              'Hanseatic Spirit',         false,  230,    'contracted'),
    ('2026-07-03'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-07-03'::date, NULL,              'Fred Olsen',               'Borealis',                 false,  1360,   'other'),
    ('2026-07-03'::date, NULL,              'Carnival',                 'Carnival Legend',           false,  2124,   'other'),
    ('2026-07-04'::date, NULL,              'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-07-04'::date, NULL,              'Saga',                     'Spirit of Discovery',      false,  999,    'other'),
    ('2026-07-05'::date, NULL,              'Nat Geo',                  'Nat Geo Resolution',       true,   148,    'other'),
    ('2026-07-05'::date, '2026-07-06'::date,'Holland America',          'Volendam',                 false,  1432,   'contracted'),
    ('2026-07-06'::date, '2026-07-07'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-07-06'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-07-07'::date, NULL,              'Princess',                 'Sky Princess',             false,  3560,   'other'),
    ('2026-07-08'::date, '2026-07-09'::date,'P&O',                      'Britannia',                false,  3647,   'contracted'),
    ('2026-07-08'::date, NULL,              'Princess',                 'Crown Princess',           false,  3599,   'other'),
    ('2026-07-09'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-07-09'::date, NULL,              'Fred Olsen',               'Bolette',                  false,  1380,   'other'),
    ('2026-07-09'::date, '2026-07-10'::date,'Aida',                     'AIDAsol',                  false,  2194,   'contracted'),
    ('2026-07-10'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-07-10'::date, '2026-07-11'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-07-10'::date, '2026-07-11'::date,'MSC',                      'MSC Preziosa',             false,  3502,   'other'),
    ('2026-07-11'::date, '2026-07-12'::date,'Regent',                   'Seven Seas Grandeur',      true,   809,    'prospect'),
    ('2026-07-11'::date, NULL,              'Scenic',                   'Scenic Eclipse',           true,   228,    'other'),
    ('2026-07-11'::date, NULL,              'Aurora Expeditions',       'Greg Mortimer',            true,   160,    'other'),
    ('2026-07-12'::date, NULL,              'Aida',                     'AIDAluna',                 false,  2050,   'contracted'),
    ('2026-07-13'::date, '2026-07-14'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-07-13'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-07-14'::date, NULL,              'Nat Geo',                  'Nat Geo Resolution',       true,   148,    'other'),
    ('2026-07-14'::date, NULL,              'Oceania',                  'Insignia',                 true,   684,    'prospect'),
    ('2026-07-14'::date, NULL,              'Silversea',                'Silver Wind',              true,   302,    'other'),
    ('2026-07-15'::date, NULL,              'TUI',                      'Mein Schiff 3',            false,  2506,   'contracted'),
    ('2026-07-16'::date, NULL,              'Seabourn',                 'Seabourn Venture',         true,   250,    'contracted'),
    ('2026-07-16'::date, '2026-07-17'::date,'Regent',                   'Seven Seas Mariner',       true,   700,    'prospect'),
    ('2026-07-17'::date, NULL,              'Costa',                    'Costa Favolosa',           false,  3016,   'contracted'),
    ('2026-07-17'::date, '2026-07-18'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-07-18'::date, NULL,              'Viking',                   'Viking Neptune',           true,   930,    'contracted'),
    ('2026-07-18'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-07-19'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-07-19'::date, NULL,              'Holland America',          'Rotterdam',                true,   2106,   'contracted'),
    ('2026-07-20'::date, '2026-07-21'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-07-20'::date, NULL,              'Viking',                   'Viking Vela',              true,   998,    'contracted'),
    ('2026-07-20'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-07-22'::date, NULL,              'Regent',                   'Seven Seas Grandeur',      false,  809,    'prospect'),
    ('2026-07-22'::date, '2026-07-23'::date,'Oceania',                  'Vista',                    true,   1200,   'prospect'),
    ('2026-07-22'::date, '2026-07-23'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-07-23'::date, NULL,              'Aurora Expeditions',       'Sylvia Earle',             true,   152,    'other'),
    ('2026-07-24'::date, '2026-07-25'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-07-24'::date, NULL,              'Oceania',                  'Insignia',                 true,   684,    'prospect'),
    ('2026-07-24'::date, NULL,              'Carnival',                 'Carnival Miracle',         false,  2124,   'other'),
    ('2026-07-25'::date, NULL,              'Regent',                   'Renaissance',              false,  694,    'prospect'),
    ('2026-07-26'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-07-26'::date, '2026-07-28'::date,'Quark Expeditions',        'Ultramarine',              true,   199,    'other'),
    ('2026-07-26'::date, NULL,              'Seabourn',                 'Seabourn Venture',         true,   250,    'contracted'),
    ('2026-07-27'::date, '2026-07-28'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-07-27'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-07-27'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-07-27'::date, '2026-07-29'::date,'TUI',                      'Mein Schiff 2',            false,  2894,   'contracted'),
    ('2026-07-29'::date, '2026-07-30'::date,'Holland America',          'Zuiderdam',                false,  2272,   'contracted'),
    ('2026-07-30'::date, NULL,              'Victory Cruise Lines',     'Ocean Victory',            true,   186,    'other'),
    ('2026-07-30'::date, NULL,              'Swan Hellenic',            'SH Diana',                 true,   192,    'other'),
    ('2026-07-31'::date, NULL,              'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),

    -- ===== AUGUST 2026 =====
    ('2026-08-01'::date, NULL,              'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-08-01'::date, NULL,              'Regent',                   'Seven Seas Grandeur',      true,   809,    'prospect'),
    ('2026-08-02'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-08-02'::date, '2026-08-03'::date,'Cunard',                   'Queen Anne',               false,  2650,   'other'),
    ('2026-08-03'::date, '2026-08-04'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-08-03'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-08-03'::date, '2026-08-04'::date,'Oceania',                  'Insignia',                 true,   684,    'prospect'),
    ('2026-08-04'::date, NULL,              'SunStone Ships',           'Ocean Explorer',           true,   140,    'other'),
    ('2026-08-04'::date, '2026-08-05'::date,'MSC',                      'MSC Preziosa',             false,  3502,   'other'),
    ('2026-08-05'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-08-05'::date, '2026-08-07'::date,'Viking',                   'Viking Saturn',            true,   930,    'contracted'),
    ('2026-08-06'::date, NULL,              'Victory Cruise Lines',     'Ocean Victory',            true,   186,    'other'),
    ('2026-08-07'::date, '2026-08-08'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-08-07'::date, NULL,              'Costa',                    'Costa Favolosa',           false,  3016,   'contracted'),
    ('2026-08-07'::date, '2026-08-08'::date,'TUI',                      'Mein Schiff 7',            false,  2894,   'contracted'),
    ('2026-08-08'::date, NULL,              'Azamara',                  'Azamara Journey',          true,   676,    'other'),
    ('2026-08-08'::date, NULL,              'Atlas Ocean Voyages',      'World Voyager',            true,   196,    'other'),
    ('2026-08-08'::date, NULL,              'Aurora Expeditions',       'Sylvia Earle',             true,   152,    'other'),
    ('2026-08-09'::date, NULL,              'Nat Geo',                  'Nat Geo Explorer',         true,   148,    'other'),
    ('2026-08-09'::date, NULL,              'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-08-09'::date, NULL,              'Swan Hellenic',            'SH Vega',                  true,   152,    'other'),
    ('2026-08-09'::date, NULL,              'Swan Hellenic',            'SH Diana',                 true,   192,    'other'),
    ('2026-08-09'::date, '2026-08-10'::date,'P&O',                      'Arcadia',                  false,  1994,   'contracted'),
    ('2026-08-10'::date, NULL,              'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-08-10'::date, NULL,              'Albatros Expeditions',     'Ocean Albatros',           true,   189,    'other'),
    ('2026-08-10'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-08-10'::date, '2026-08-11'::date,'Fred Olsen',               'Balmoral',                 false,  1747,   'other'),
    ('2026-08-11'::date, NULL,              'Atlas Ocean Voyages',      'World Navigator',          true,   196,    'other'),
    ('2026-08-11'::date, '2026-08-12'::date,'Plantours',                'Hamburg',                  false,  420,    'other'),
    ('2026-08-11'::date, NULL,              'Fred Olsen',               'Bolette',                  false,  1380,   'other'),
    ('2026-08-11'::date, '2026-08-12'::date,'Aida',                     'AIDAbella',                false,  2050,   'contracted'),
    ('2026-08-12'::date, '2026-08-13'::date,'Cunard',                   'Queen Mary 2',             false,  2691,   'other'),
    ('2026-08-12'::date, NULL,              'Aida',                     'AIDAluna',                 false,  2050,   'contracted'),
    ('2026-08-13'::date, NULL,              'Oceania',                  'Marina',                   true,   1285,   'prospect'),
    ('2026-08-14'::date, NULL,              'Ambassador',               'Ambition',                 false,  1196,   'contracted'),
    ('2026-08-14'::date, NULL,              'Holland America',          'Nieuw Statendam',          false,  2650,   'contracted'),
    ('2026-08-14'::date, '2026-08-15'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-08-14'::date, '2026-08-15'::date,'Swan Hellenic',            'SH Vega',                  true,   152,    'other'),
    ('2026-08-15'::date, NULL,              'Virgin',                   'Valiant Lady',             false,  2770,   'other'),
    ('2026-08-15'::date, NULL,              'Hapag-Lloyd',              'Hanseatic Nature',         true,   200,    'contracted'),
    ('2026-08-15'::date, NULL,              'Poseidon Expeditions',     'Sea Spirit',               true,   114,    'other'),
    ('2026-08-16'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-08-16'::date, NULL,              'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-08-16'::date, NULL,              'Aurora Expeditions',       'Greg Mortimer',            true,   160,    'other'),
    ('2026-08-16'::date, '2026-08-17'::date,'Viking',                   'Viking Mars',              true,   930,    'contracted'),
    ('2026-08-17'::date, NULL,              'Viking',                   'Viking Vela',              true,   998,    'contracted'),
    ('2026-08-17'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-08-17'::date, NULL,              'Swan Hellenic',            'SH Diana',                 true,   192,    'other'),
    ('2026-08-18'::date, NULL,              'Ritz-Carlton',             'Evrima',                   true,   298,    'other'),
    ('2026-08-18'::date, NULL,              'Quark Expeditions',        'Ultramarine',              true,   199,    'other'),
    ('2026-08-18'::date, NULL,              'Scenic',                   'Scenic Eclipse',           true,   228,    'other'),
    ('2026-08-18'::date, '2026-08-20'::date,'TUI',                      'Mein Schiff 2',            false,  2894,   'contracted'),
    ('2026-08-19'::date, NULL,              'Hurtigruten',              'Spitsbergen',              true,   335,    'other'),
    ('2026-08-19'::date, NULL,              'Aurora Expeditions',       'Sylvia Earle',             true,   152,    'other'),
    ('2026-08-20'::date, NULL,              'Atlas Ocean Voyages',      'World Navigator',          true,   196,    'other'),
    ('2026-08-20'::date, NULL,              'Regent',                   'Seven Seas Voyager',       false,  700,    'prospect'),
    ('2026-08-21'::date, '2026-08-22'::date,'Celebrity',                'Celebrity Silhouette',     true,   2886,   'other'),
    ('2026-08-21'::date, '2026-08-22'::date,'SunStone Ships',           'Ocean Adventurer',         true,   132,    'other'),
    ('2026-08-22'::date, NULL,              'Seabourn',                 'Seabourn Ovation',         true,   604,    'contracted'),
    ('2026-08-23'::date, NULL,              'Holland America',          'Rotterdam',                true,   2106,   'contracted'),
    ('2026-08-23'::date, NULL,              'Oceania',                  'Marina',                   true,   1285,   'prospect'),
    ('2026-08-24'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-08-24'::date, NULL,              'Silversea',                'Silver Endeavour',         true,   260,    'other'),
    ('2026-08-26'::date, NULL,              'Phoenix Reisen',           'Amera',                    false,  835,    'contracted'),
    ('2026-08-27'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-08-27'::date, '2026-08-28'::date,'MSC',                      'MSC Preziosa',             false,  3502,   'other'),
    ('2026-08-29'::date, NULL,              'Aida',                     'AIDAdiva',                 false,  1025,   'contracted'),
    ('2026-08-29'::date, '2026-08-30'::date,'TUI',                      'Mein Schiff 1',            false,  2894,   'contracted'),
    ('2026-08-30'::date, NULL,              'Quark Expeditions',        'Ultramarine',              true,   199,    'other'),
    ('2026-08-30'::date, '2026-08-31'::date,'Viking',                   'Viking Mira',              true,   990,    'contracted'),
    ('2026-08-31'::date, NULL,              'Hurtigruten',              'Spitsbergen',              true,   335,    'other'),
    ('2026-08-31'::date, NULL,              'Windstar',                 'Star Pride',               true,   212,    'prospect'),
    ('2026-08-31'::date, NULL,              'Phoenix Reisen',           'Artania',                  false,  1176,   'contracted'),

    -- ===== SEPTEMBER 2026 =====
    ('2026-09-01'::date, NULL,              'Viking',                   'Viking Mira',              true,   990,    'contracted'),
    ('2026-09-01'::date, NULL,              'Phoenix Reisen',           'Artania',                  false,  1176,   'contracted'),
    ('2026-09-02'::date, '2026-09-03'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-09-03'::date, NULL,              'Princess',                 'Sky Princess',             false,  3560,   'other'),
    ('2026-09-05'::date, NULL,              'Hurtigruten',              'Fram',                     true,   318,    'other'),
    ('2026-09-06'::date, NULL,              'Virgin',                   'Valiant Lady',             true,   2770,   'other'),
    ('2026-09-07'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-09-07'::date, '2026-09-08'::date,'Aida',                     'AIDAluna',                 false,  2050,   'contracted'),
    ('2026-09-08'::date, NULL,              'Silversea',                'Silver Endeavour',         true,   260,    'other'),
    ('2026-09-08'::date, NULL,              'Poseidon Expeditions',     'Sea Spirit',               true,   114,    'other'),
    ('2026-09-09'::date, NULL,              'Hurtigruten',              'Spitsbergen',              true,   335,    'other'),
    ('2026-09-10'::date, '2026-09-12'::date,'Azamara',                  'Azamara Journey',          true,   676,    'other'),
    ('2026-09-11'::date, NULL,              'Atlas Ocean Voyages',      'World Navigator',          true,   196,    'other'),
    ('2026-09-11'::date, NULL,              'Quark Expeditions',        'Ultramarine',              true,   199,    'other'),
    ('2026-09-15'::date, NULL,              'Plantours',                'Hamburg',                  false,  420,    'other'),
    ('2026-09-15'::date, NULL,              'Ambassador',               'Ambience',                 false,  1596,   'contracted'),
    ('2026-09-16'::date, '2026-09-17'::date,'Explora Journeys',         'Explora 3',                true,   962,    'other'),
    ('2026-09-17'::date, NULL,              'Poseidon Expeditions',     'Sea Spirit',               true,   114,    'other'),
    ('2026-09-18'::date, NULL,              'Nat Geo',                  'Nat Geo Endurance',        true,   148,    'other'),
    ('2026-09-18'::date, '2026-09-19'::date,'Norwegian Cruise Line',    'Norwegian Star',           true,   2348,   'prospect'),
    ('2026-09-19'::date, NULL,              'Hurtigruten',              'Fram',                     true,   318,    'other'),
    ('2026-09-19'::date, NULL,              'Aurora Expeditions',       'Sylvia Earle',             true,   152,    'other'),
    ('2026-09-20'::date, NULL,              'Quark Expeditions',        'Ultramarine',              true,   199,    'other'),
    ('2026-09-20'::date, '2026-09-21'::date,'SunStone Ships',           'Ocean Adventurer',         true,   132,    'other'),
    ('2026-09-21'::date, NULL,              'Hurtigruten',              'Spitsbergen',              true,   335,    'other'),
    ('2026-09-21'::date, NULL,              'VIVA Cruises',             'Seaventure',               true,   164,    'other'),
    ('2026-09-21'::date, NULL,              'Atlas Ocean Voyages',      'World Voyager',            true,   196,    'other'),
    ('2026-09-23'::date, NULL,              'Silversea',                'Silver Endeavour',         true,   260,    'other'),
    ('2026-09-24'::date, NULL,              'Hapag-Lloyd',              'Hanseatic Spirit',         true,   230,    'contracted'),
    ('2026-09-26'::date, NULL,              'Poseidon Expeditions',     'Sea Spirit',               true,   114,    'other'),
    ('2026-09-26'::date, NULL,              'Princess',                 'Majestic Princess',        false,  3560,   'other'),
    ('2026-09-27'::date, NULL,              'VIVA Cruises',             'Seaventure',               true,   164,    'other'),
    ('2026-09-27'::date, '2026-09-28'::date,'Ponant',                   'Le Commandant Charcot',    true,   250,    'other')
)
INSERT INTO port_calls (ship_id, date, end_date, turnaround, pax, status)
SELECT s.id, pcd.arrival, pcd.departure, pcd.turnaround, pcd.pax, pcd.status
FROM port_call_data pcd
JOIN cruise_lines cl ON cl.name = pcd.cruise_line_name
JOIN ships s ON s.name = pcd.ship_name AND s.cruise_line_id = cl.id;


-- ============================================================================
-- 4. PROJECTION TEMPLATES + RESOURCES
-- ============================================================================
-- One template per (ship or cruise_line) × call_type × day_type.
-- Resources are stored as amount × time_units × unit_price_isk so the total
-- is computed dynamically and updates when any input changes.
-- ============================================================================

-- ── Celebrity Silhouette — Turnaround — Weekend (4,835,455 kr) ──────────────
WITH t AS (
    INSERT INTO projection_templates (ship_id, call_type, day_type)
    SELECT s.id, 'turnaround', 'weekend'
    FROM ships s JOIN cruise_lines cl ON cl.id = s.cruise_line_id
    WHERE s.name = 'Celebrity Silhouette' AND cl.name = 'Celebrity'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('provision_loading',  'Telescopic Forklift',        1, 8,  9944,   1),
    ('provision_loading',  'Forklift',                   2, 8,  8440,   2),
    ('provision_loading',  'Forklift Driver (Overtime)', 3, 8,  10850,  3),
    ('provision_loading',  'Stevedore (Overtime)',       3, 8,  9650,   4),
    ('provision_loading',  'Pallet Jack',                2, 1,  8000,   5),
    ('provision_loading',  'Container Ramp',             2, 1,  12500,  6),
    ('provision_loading',  'Pallet Cage',                2, 1,  14500,  7),
    ('provision_loading',  'Forklift Transport',         2, 1,  42500,  8),
    ('luggage_operations', 'Telescopic Forklift',        2, 12, 9944,   1),
    ('luggage_operations', 'Forklift',                   2, 12, 8440,   2),
    ('luggage_operations', 'Forklift Driver (Daytime)',  4, 12, 9250,   3),
    ('luggage_operations', 'Luggage Cage',               2, 1,  36500,  4),
    ('luggage_operations', 'Porter Service (Overtime)', 30, 10, 8750,   5),
    ('luggage_operations', 'Forklift Transport',         2, 1,  42500,  6),
    ('waste_offload',      'Telescopic Forklift',        1, 5,  9944,   1),
    ('waste_offload',      'Forklift',                   1, 5,  8440,   2),
    ('waste_offload',      'Forklift Driver (Overtime)', 2, 5,  10850,  3),
    ('waste_offload',      'Stevedore (Overtime)',       1, 5,  9650,   4),
    ('waste_offload',      'Pallet Cage',                1, 1,  14500,  5),
    ('waste_offload',      'Forklift Transport',         1, 1,  42500,  6)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── Norwegian Star — Turnaround — Weekend (5,615,903 kr) ────────────────────
WITH t AS (
    INSERT INTO projection_templates (ship_id, call_type, day_type)
    SELECT s.id, 'turnaround', 'weekend'
    FROM ships s JOIN cruise_lines cl ON cl.id = s.cruise_line_id
    WHERE s.name = 'Norwegian Star' AND cl.name = 'Norwegian Cruise Line'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('provision_loading',  'Telescopic Forklift',        2, 9,  9944,   1),
    ('provision_loading',  'Forklift',                   2, 9,  8440,   2),
    ('provision_loading',  'Forklift Driver (Daytime)',  4, 9,  9250,   3),
    ('provision_loading',  'Stevedore (Daytime)',        4, 9,  8150,   4),
    ('provision_loading',  'Pallet Jack',                2, 1,  8000,   5),
    ('provision_loading',  'Container Ramp',             2, 1,  12500,  6),
    ('provision_loading',  'Pallet Cage',                2, 1,  14500,  7),
    ('provision_loading',  'Forklift Transport',         3, 1,  42500,  8),
    ('luggage_operations', 'Telescopic Forklift',        2, 12, 9944,   1),
    ('luggage_operations', 'Forklift',                   2, 12, 8440,   2),
    ('luggage_operations', 'Forklift Driver (Daytime)',  4, 12, 9250,   3),
    ('luggage_operations', 'Luggage Cage',               2, 1,  36500,  4),
    ('luggage_operations', 'Porter Service (Overtime)', 35, 10, 8750,   5),
    ('luggage_operations', 'Forklift Transport',         2, 1,  42500,  6),
    ('waste_offload',      'Telescopic Forklift',        1, 6,  9944,   1),
    ('waste_offload',      'Forklift',                   1, 6,  8440,   2),
    ('waste_offload',      'Forklift Driver (Overtime)', 2, 6,  10850,  3),
    ('waste_offload',      'Stevedore (Overtime)',       1, 6,  9650,   4),
    ('waste_offload',      'Pallet Cage',                1, 1,  14500,  5),
    ('waste_offload',      'Forklift Transport',         1, 1,  42500,  6)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── Rotterdam — Turnaround — Weekend (3,871,277 kr) ─────────────────────────
WITH t AS (
    INSERT INTO projection_templates (ship_id, call_type, day_type)
    SELECT s.id, 'turnaround', 'weekend'
    FROM ships s JOIN cruise_lines cl ON cl.id = s.cruise_line_id
    WHERE s.name = 'Rotterdam' AND cl.name = 'Holland America'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('provision_loading',  'Telescopic Forklift',        1, 4,  9944,   1),
    ('provision_loading',  'Forklift',                   2, 4,  8440,   2),
    ('provision_loading',  'Forklift Driver (Daytime)',  3, 4,  9250,   3),
    ('provision_loading',  'Stevedore (Daytime)',        3, 4,  8150,   4),
    ('provision_loading',  'Pallet Jack',                2, 1,  8000,   5),
    ('provision_loading',  'Container Ramp',             2, 1,  12500,  6),
    ('provision_loading',  'Pallet Cage',                2, 1,  14500,  7),
    ('provision_loading',  'Forklift Transport',         2, 1,  42500,  8),
    ('luggage_operations', 'Telescopic Forklift',        2, 11, 9944,   1),
    ('luggage_operations', 'Forklift',                   2, 11, 8440,   2),
    ('luggage_operations', 'Forklift Driver (Overtime)', 4, 11, 10850,  3),
    ('luggage_operations', 'Luggage Cage',               2, 1,  36500,  4),
    ('luggage_operations', 'Foreman (Overtime)',         1, 11, 10065,  5),
    ('luggage_operations', 'Porter Service (Overtime)',  7, 8,  8750,   6),
    ('luggage_operations', 'Porter Service (Overtime)', 12, 9,  8750,   7),
    ('luggage_operations', 'Porter Service (Overtime)',  6, 11, 8750,   8),
    ('luggage_operations', 'Forklift Transport',         2, 1,  42500,  9),
    ('waste_offload',      'Telescopic Forklift',        1, 4,  9944,   1),
    ('waste_offload',      'Forklift',                   1, 4,  8440,   2),
    ('waste_offload',      'Forklift Driver (Daytime)',  2, 4,  9250,   3),
    ('waste_offload',      'Stevedore (Daytime)',        1, 4,  8150,   4),
    ('waste_offload',      'Pallet Cage',                1, 1,  14500,  5),
    ('waste_offload',      'Forklift Transport',         1, 1,  42500,  6)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── Viking (fleet-wide) — Turnaround — Weekday (2,692,260 kr) ───────────────
WITH t AS (
    INSERT INTO projection_templates (cruise_line_id, call_type, day_type)
    SELECT id, 'turnaround', 'weekday' FROM cruise_lines WHERE name = 'Viking'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('provision_loading',  'Telescopic Forklift',        1, 8, 9944,    1),
    ('provision_loading',  'Forklift',                   2, 8, 8440,    2),
    ('provision_loading',  'Forklift Driver (Overtime)', 3, 8, 10850,   3),
    ('provision_loading',  'Stevedore (Overtime)',       2, 8, 9650,    4),
    ('provision_loading',  'Pallet Jack',                2, 1, 8000,    5),
    ('provision_loading',  'Container Ramp',             2, 1, 12500,   6),
    ('provision_loading',  'Pallet Cage',                2, 1, 14500,   7),
    ('provision_loading',  'Forklift Transport',         2, 1, 42500,   8),
    ('luggage_operations', 'Flat fee',                   1, 1, 1750000, 1),
    ('waste_offload',      'Telescopic Forklift',        1, 4, 9944,    1),
    ('waste_offload',      'Forklift Driver (Daytime)',  1, 4, 9250,    2),
    ('waste_offload',      'Stevedore (Overtime)',       1, 4, 9650,    3),
    ('waste_offload',      'Forklift Transport',         1, 1, 42500,   4)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── Celebrity Eclipse — Transit — Weekday (1,069,353 kr) ────────────────────
WITH t AS (
    INSERT INTO projection_templates (ship_id, call_type, day_type)
    SELECT s.id, 'transit', 'weekday'
    FROM ships s JOIN cruise_lines cl ON cl.id = s.cruise_line_id
    WHERE s.name = 'Celebrity Eclipse' AND cl.name = 'Celebrity'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('provision_loading',  'Telescopic Forklift',       1, 8, 9944,   1),
    ('provision_loading',  'Forklift',                  2, 8, 8440,   2),
    ('provision_loading',  'Forklift Driver (Daytime)', 3, 8, 9250,   3),
    ('provision_loading',  'Stevedore (Daytime)',       3, 8, 8150,   4),
    ('provision_loading',  'Pallet Jack',               2, 1, 8000,   5),
    ('provision_loading',  'Container Ramp',            2, 1, 12500,  6),
    ('provision_loading',  'Pallet Cage',               2, 1, 14500,  7),
    ('provision_loading',  'Forklift Transport',        2, 1, 42500,  8),
    ('waste_offload',      'Telescopic Forklift',       1, 5, 9944,   1),
    ('waste_offload',      'Forklift',                  1, 5, 8440,   2),
    ('waste_offload',      'Forklift Driver (Daytime)', 2, 5, 9250,   3),
    ('waste_offload',      'Stevedore (Daytime)',       1, 5, 8150,   4),
    ('waste_offload',      'Pallet Cage',               1, 1, 14500,  5),
    ('waste_offload',      'Forklift Transport',        1, 1, 42500,  6)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── TUI / Mein Schiff (fleet-wide) — Transit — Weekend (125,674 kr) ─────────
WITH t AS (
    INSERT INTO projection_templates (cruise_line_id, call_type, day_type)
    SELECT id, 'transit', 'weekend' FROM cruise_lines WHERE name = 'TUI'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('waste_offload', 'Telescopic Forklift',        1, 4, 9944,  1),
    ('waste_offload', 'Forklift Driver (Overtime)', 1, 4, 10850, 2),
    ('waste_offload', 'Forklift Transport',         1, 1, 42500, 3)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


-- ── TUI / Mein Schiff (fleet-wide) — Transit — Weekday (119,274 kr) ─────────
WITH t AS (
    INSERT INTO projection_templates (cruise_line_id, call_type, day_type)
    SELECT id, 'transit', 'weekday' FROM cruise_lines WHERE name = 'TUI'
    RETURNING id
)
INSERT INTO projection_resources (template_id, section, resource_name, amount, time_units, unit_price_isk, sort_order)
SELECT t.id, v.section, v.resource_name, v.amount, v.time_units, v.unit_price_isk, v.sort_order FROM t, (VALUES
    ('waste_offload', 'Telescopic Forklift',       1, 4, 9944,  1),
    ('waste_offload', 'Forklift Driver (Daytime)', 1, 4, 9250,  2),
    ('waste_offload', 'Forklift Transport',        1, 1, 42500, 3)
) AS v(section, resource_name, amount, time_units, unit_price_isk, sort_order);


COMMIT;
