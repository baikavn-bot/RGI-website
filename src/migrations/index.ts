import * as migration_20261016_040416_initial from './20261016_040416_initial';
import * as migration_20261016_043826_review_fixes from './20261016_043826_review_fixes';
import * as migration_20261026_071359_san_pham_catalog_v3 from './20261026_071359_san_pham_catalog_v3';

export const migrations = [
  {
    up: migration_20261016_040416_initial.up,
    down: migration_20261016_040416_initial.down,
    name: '20261016_040416_initial',
  },
  {
    up: migration_20261016_043826_review_fixes.up,
    down: migration_20261016_043826_review_fixes.down,
    name: '20261016_043826_review_fixes',
  },
  {
    up: migration_20261026_071359_san_pham_catalog_v3.up,
    down: migration_20261026_071359_san_pham_catalog_v3.down,
    name: '20261026_071359_san_pham_catalog_v3'
  },
];
