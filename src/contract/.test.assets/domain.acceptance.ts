// for acceptance tests: import from compiled dist (like a real user's node_modules)
import { Event, Entity, Literal, prop } from '../../../dist/contract/module.js';

const photo = new Literal({
  name: 'photo',
  properties: {
    url: prop.VARCHAR(255),
  },
});
const user = new Entity({
  name: 'user',
  properties: {
    phone_number: prop.CHAR(10), // only us numbers allowed
    first_name: prop.VARCHAR(255),
    last_name: prop.VARCHAR(255),
    avatar_id: {
      ...prop.REFERENCES(photo),
      updatable: true,
    },
  },
  unique: ['phone_number'], // users are identified by their phone number
});
const host = new Entity({
  name: 'host',
  properties: {
    tax_id: prop.VARCHAR(255),
    owner_id: prop.REFERENCES(user),
    contact_id: {
      ...prop.REFERENCES(user),
      updatable: true,
    },
  },
  unique: ['tax_id'], // hosts are identified by their tax ids
});
const home = new Entity({
  name: 'home',
  properties: {
    name: prop.VARCHAR(255),
    host_ids: prop.ARRAY_OF(prop.REFERENCES(host)), // one home may have more than one host (for some reason in this example... just go with it)
    built: prop.TIMESTAMPTZ(),
    bedrooms: prop.INT(),
    bathrooms: prop.INT(),
    tags: prop.ARRAY_OF(prop.VARCHAR()), // native primitive array -> text[] column, not a join table
    amenities: {
      ...prop.ARRAY_OF(prop.ENUM(['POOL', 'WIFI', 'PARKING'])), // native enum array -> varchar[] + membership check
      updatable: true, // a home's amenities change over time
    },
    photo_ids: {
      ...prop.ARRAY_OF(prop.REFERENCES(photo)),
      updatable: true, // the photos of a home change over time
    },
  },
  unique: ['name', 'host_ids'],
});
// a self-contained native-array entity with no reference-array dependencies, so its whole
// generated graph (static + version + cvp + upsert + view) applies cleanly to a real postgres.
// this is the vehicle for the acceptance-level full round-trip: it exercises the identical
// native-array codegen paths as `home` (static primitive array, static numeric array, updatable
// enum array), but without home's transitive `user` table (a reserved word the generator emits
// unquoted), which would block a literal apply of home's own graph.
const parcel = new Entity({
  name: 'parcel',
  properties: {
    apn: prop.VARCHAR(255), // assessor parcel number; scalar unique key
    tags: prop.ARRAY_OF(prop.VARCHAR()), // static native primitive array -> varchar[] column
    lot_dimensions: prop.ARRAY_OF(prop.NUMERIC()), // static native numeric array -> numeric[] column
    land_use: {
      ...prop.ARRAY_OF(prop.ENUM(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL'])), // updatable native enum array -> varchar[] + membership check on the version table
      updatable: true, // a parcel's permitted land uses change over time
    },
  },
  unique: ['apn'],
});
const welcomedHomeEvent = new Event({
  name: 'welcomed_home_event',
  properties: {
    occurred_at: prop.DATE(),
    home_id: prop.REFERENCES(home),
    user_id: prop.REFERENCES(user),
  },
  unique: ['occurred_at', 'home_id'], // only one user can be welcomed at a time
});
const message = new Entity({
  name: 'message',
  properties: {
    about_home_id: prop.REFERENCES(home),
    from_user_id: prop.REFERENCES(user),
    text: prop.VARCHAR(), // the text they sent as part of the message
    image_uuids: prop.ARRAY_OF(prop.UUID()), // the images they sent as part of the message (e.g., references a table in a different db by uuid)
  },
  unique: ['uuid'],
});

export const generateSqlSchemasFor = [
  photo,
  user,
  host,
  home,
  parcel,
  welcomedHomeEvent,
  message,
];
