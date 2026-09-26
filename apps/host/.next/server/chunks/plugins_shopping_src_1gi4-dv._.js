module.exports=[87047,2848,e=>{"use strict";var i=e.i(76772);e.i(29789);var t=e.i(57968),s=e.i(48161),r=e.i(22674);function n({children:e,className:t,flush:s=!1}){return(0,i.jsx)("section",{className:(0,r.cn)("rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5",s?"overflow-hidden":"p-5",t),children:e})}function d({title:e,children:t}){return(0,i.jsxs)(n,{className:"mx-auto max-w-lg text-center",children:[(0,i.jsx)("h1",{className:"font-display text-2xl font-bold",children:e}),(0,i.jsx)("div",{className:"mt-3 text-sm text-ink/70 dark:text-paper/70",children:t})]})}e.s(["Notice",0,d,"Panel",0,n],2848),e.s(["pageScope",0,function(e){let r=(0,s.translator)((0,s.localeOf)(e),"guard");return e.user?e.db?{ok:!0,db:e.db,user:e.user}:{ok:!1,notice:(0,i.jsx)(d,{title:r("unavailableTitle"),children:(0,i.jsx)("p",{children:r("unavailableBody")})})}:{ok:!1,notice:(0,i.jsx)(d,{title:r("signInTitle"),children:(0,i.jsx)("p",{children:(0,t.rich)(r("signInBody"),{link:(0,i.jsx)("a",{className:"font-medium text-quake underline",href:`${e.hostUrl}/#account`,children:r("signInLink")})})})})}}],87047)},21513,63767,37699,28789,e=>{"use strict";var i=e.i(66680);class t extends Error{status;key;params;constructor(e,i,t={}){super(i),this.status=e,this.key=i,this.params=t}}e.s(["HttpError",0,t],63767);let s="ABCDEFGHJKMNPQRSTUVWXYZ23456789";function r(e){let i="";for(let t=0;t<8;t++)i+=s[e(s.length)];return i}function n(e,i,t){return`/api/lists/${e}/items/${i}/photo?v=${t}`}e.s(["CURRENCIES",0,["RON","EUR","USD","HUF","GBP"],"INVITE_CODE_PATTERN",0,/^[A-HJ-KM-NP-Z2-9]{8}$/,"newInviteCode",0,r],37699),e.s(["MAX_PHOTO_BYTES",0,2097152,"photoUrl",0,n,"sniffPhoto",0,function(e){if(e.length<12)return null;if(255===e[0]&&216===e[1]&&255===e[2])return"image/jpeg";if(137===e[0]&&80===e[1]&&78===e[2]&&71===e[3]&&13===e[4]&&10===e[5])return"image/png";let i=(i,t)=>String.fromCharCode(...e.slice(i,t));return"RIFF"===i(0,4)&&"WEBP"===i(8,12)?"image/webp":null}],28789);let d="DATE_FORMAT(l.shop_date, '%Y-%m-%d') AS shop_date";async function a(e,i,t){let[s]=await e.query(`SELECT l.id, l.name, l.currency, ${d}, l.version, m.role
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE l.id = ? AND m.user_id = ?`,[i,t]);return s??null}async function l(e,i,s){let r=await a(e,i,s);if(!r)throw new t(404,"listNotFound");return r}async function o(e,i,s){let r=await l(e,i,s);if("owner"!==r.role)throw new t(403,"ownerOnly");return r}async function m(e,i){await e.execute("UPDATE lists SET version = version + 1 WHERE id = ?",[i])}async function _(e,i,t){await e.execute("UPDATE list_members SET display_name = ? WHERE list_id = ? AND user_id = ? AND display_name <> ?",[t.displayName,i,t.id,t.displayName])}async function u(e,i){return(await e.query(`SELECT l.id, l.name, l.currency, ${d}, m.role,
            (SELECT COUNT(*) FROM list_members x WHERE x.list_id = l.id) AS members,
            (SELECT COUNT(*) FROM items i
              WHERE i.list_id = l.id AND i.done_at IS NULL AND i.dropped_at IS NULL) AS open,
            (SELECT COUNT(*) FROM items i WHERE i.list_id = l.id AND i.done_at IS NOT NULL) AS done,
            (SELECT SUM(i.price * COALESCE(i.quantity, 1)) FROM items i
              WHERE i.list_id = l.id AND (i.done_at IS NOT NULL OR i.dropped_at IS NULL)) AS total
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE m.user_id = ?
      ORDER BY l.shop_date DESC, l.updated_at DESC`,[i])).map(e=>({id:e.id,name:e.name,currency:e.currency,shopDate:e.shop_date,role:e.role,members:Number(e.members),open:Number(e.open??0),done:Number(e.done??0),total:Math.round(100*Number(e.total??0))/100}))}let c=`i.id, i.list_id, i.store_id, i.name, i.quantity, i.unit, i.price,
  i.estimated_price, i.price_corrected_by_name, i.description,
  i.added_by_name, i.done_at, i.done_by_name, i.dropped_at, i.dropped_by_name,
  UNIX_TIMESTAMP(p.updated_at) AS photo_v`;function E(e){return{id:e.id,storeId:e.store_id,name:e.name,quantity:null===e.quantity?null:Number(e.quantity),unit:e.unit,price:null===e.price?null:Number(e.price),estimatedPrice:null===e.estimated_price?null:Number(e.estimated_price),priceCorrectedByName:e.price_corrected_by_name,description:e.description,addedByName:e.added_by_name,done:null!==e.done_at,doneByName:e.done_by_name,dropped:null!==e.dropped_at,droppedByName:e.dropped_by_name,photo:null===e.photo_v?null:n(e.list_id,e.id,Number(e.photo_v))}}async function p(e,i,t){let s=await l(e,i,t),[r,n,d]=await Promise.all([e.query(`SELECT user_id, display_name, role FROM list_members WHERE list_id = ?
        ORDER BY role = 'owner' DESC, joined_at`,[i]),e.query("SELECT id, name, type, location, description FROM stores WHERE list_id = ? ORDER BY name, id",[i]),e.query(`SELECT ${c}
         FROM items i LEFT JOIN item_photos p ON p.item_id = i.id
        WHERE i.list_id = ? ORDER BY i.position, i.id`,[i])]);return{id:s.id,name:s.name,currency:s.currency,shopDate:s.shop_date,version:Number(s.version),role:s.role,members:r.map(e=>({userId:e.user_id,displayName:e.display_name,role:e.role})),stores:n,items:d.map(E)}}async function N(e,i,t,s,r){return e.transaction(async e=>{let{insertId:n}=await e.execute("INSERT INTO lists (name, currency, shop_date, owner_user_id) VALUES (?, ?, ?, ?)",[t,s,r,i.id]);return await e.execute("INSERT INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'owner', ?)",[n,i.id,i.displayName]),n})}async function y(e,i,t){let[s]=await e.query("SELECT code FROM list_invites WHERE list_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1",[i]);return s?s.code:O(e,i,t)}async function O(e,t,s){await e.execute("UPDATE list_invites SET revoked_at = UTC_TIMESTAMP() WHERE list_id = ? AND revoked_at IS NULL",[t]);for(let n=0;n<5;n++){let n=r(i.randomInt);try{return await e.execute("INSERT INTO list_invites (list_id, code, created_by) VALUES (?, ?, ?)",[t,n,s]),n}catch(e){if("ER_DUP_ENTRY"!==e.code)throw e}}throw Error("Could not create an invite code")}async function R(e,i){let[t]=await e.query(`SELECT l.id, l.name,
            (SELECT display_name FROM list_members WHERE list_id = l.id AND role = 'owner' LIMIT 1) AS owner,
            (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) AS members
       FROM list_invites i JOIN lists l ON l.id = i.list_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,[i]);return t??null}async function S(e,i,s){let r=await R(e,i);if(!r)throw new t(404,"inviteInvalid");return(await e.execute("INSERT IGNORE INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",[r.id,s.id,s.displayName])).affectedRows>0&&(await e.execute("INSERT INTO list_events (list_id, user_id, user_name, kind) VALUES (?, ?, ?, 'member_joined')",[r.id,s.id,s.displayName]),await m(e,r.id)),r.id}async function T(e,i,t){let s=new Map;if(0===t.length)return s;let r=t.map(()=>"?").join(", "),[n,d]=await Promise.all([e.query(`SELECT s.list_id, s.id, s.name, s.type, s.location, s.description
         FROM stores s JOIN list_members m ON m.list_id = s.list_id AND m.user_id = ?
        WHERE s.list_id IN (${r}) ORDER BY s.name, s.id`,[i,...t]),e.query(`SELECT ${c}
         FROM items i JOIN list_members m ON m.list_id = i.list_id AND m.user_id = ?
         LEFT JOIN item_photos p ON p.item_id = i.id
        WHERE i.list_id IN (${r}) ORDER BY i.position, i.id`,[i,...t])]),a=e=>{let i=s.get(e);return i||(i={stores:[],items:[]},s.set(e,i)),i};for(let{list_id:e,...i}of n)a(e).stores.push(i);for(let e of d)a(e.list_id).items.push(E(e));return s}let I=`(SELECT list_id, user_id, display_name FROM list_members
   UNION ALL SELECT list_id, user_id, display_name FROM deleted_list_members)`;async function b(e,i){let t=`JOIN ${I} me ON me.list_id = x.list_id AND me.user_id = ?`,[s,r,n,a]=await Promise.all([e.query(`SELECT l.id, l.name, l.currency, ${d}, l.deleted_at IS NOT NULL AS deleted
         FROM lists l JOIN ${I} me ON me.list_id = l.id AND me.user_id = ?`,[i]),e.query(`SELECT x.list_id, x.user_id, x.display_name FROM ${I} x ${t}
        WHERE x.user_id <> ?`,[i,i]),e.query(`SELECT x.list_id, x.store_id, x.name, x.unit, x.quantity, x.price, x.done_at, x.dropped_at, x.added_by, x.done_by
         FROM items x ${t}`,[i]),e.query(`SELECT x.id, x.name, x.type FROM stores x ${t}`,[i])]);return{userId:i,lists:s.map(e=>({id:e.id,name:e.name,currency:e.currency,shopDate:e.shop_date,deleted:1===Number(e.deleted)})),members:r.map(e=>({listId:e.list_id,userId:e.user_id,displayName:e.display_name})),items:n.map(e=>({listId:e.list_id,storeId:e.store_id,name:e.name,unit:e.unit,quantity:null===e.quantity?null:Number(e.quantity),price:null===e.price?null:Number(e.price),done:null!==e.done_at,dropped:null!==e.dropped_at,addedBy:e.added_by,doneBy:e.done_by})),stores:a}}async function L(e,i){return(await e.query(`SELECT i.id AS item_id, i.list_id, ${d}, i.name, i.unit, i.quantity, i.price,
            i.description, s.name AS store_name, s.type AS store_type,
            s.location AS store_location, s.description AS store_description,
            UNIX_TIMESTAMP(p.updated_at) AS photo_v
       FROM items i
       JOIN lists l ON l.id = i.list_id
       JOIN list_members me ON me.list_id = i.list_id AND me.user_id = ?
       LEFT JOIN stores s ON s.id = i.store_id
       LEFT JOIN item_photos p ON p.item_id = i.id
      ORDER BY l.shop_date DESC, i.id DESC
      LIMIT 1500`,[i])).map(e=>({itemId:e.item_id,listId:e.list_id,shopDate:e.shop_date,name:e.name,unit:e.unit,quantity:null===e.quantity?null:Number(e.quantity),price:null===e.price?null:Number(e.price),description:e.description,storeName:e.store_name,storeType:e.store_type,storeLocation:e.store_location,storeDescription:e.store_description,photo:null===e.photo_v?null:n(e.list_id,e.item_id,Number(e.photo_v))}))}async function A(e,i){let[t]=await e.query(`SELECT COUNT(*) AS lists, SUM(l.version) AS versions
       FROM lists l JOIN list_members m ON m.list_id = l.id AND m.user_id = ?`,[i]);return`${Number(t?.lists??0)}:${Number(t?.versions??0)}`}async function h(e,i,t,s=20){return(await e.query(`SELECT e.id, e.list_id, l.name AS list_name, e.user_name, e.kind, e.item_name,
            DATE_FORMAT(e.created_at, '%Y-%m-%dT%H:%i:%sZ') AS at
       FROM list_events e
       JOIN list_members m ON m.list_id = e.list_id AND m.user_id = ?
       JOIN lists l ON l.id = e.list_id
       LEFT JOIN notification_clears c ON c.user_id = ?
      WHERE (e.user_id IS NULL OR e.user_id <> ?) AND e.id > ?
        AND e.id > COALESCE(c.cleared_up_to, 0)
        AND NOT EXISTS (SELECT 1 FROM notification_dismissals d
                         WHERE d.user_id = ? AND d.event_id = e.id)
      ORDER BY e.id DESC
      LIMIT ${Math.max(1,Math.min(s,50))}`,[i,i,i,t??0,i])).map(e=>({id:Number(e.id),listId:e.list_id,listName:e.list_name,userName:e.user_name,kind:e.kind,itemName:e.item_name,at:e.at}))}async function f(e,i,t){await e.execute(`INSERT INTO notification_clears (user_id, cleared_up_to) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cleared_up_to = GREATEST(cleared_up_to, VALUES(cleared_up_to))`,[i,t]),await e.execute("DELETE FROM notification_dismissals WHERE user_id = ? AND event_id <= ?",[i,t])}async function D(e,i,t){await e.execute(`INSERT IGNORE INTO notification_dismissals (user_id, event_id)
     SELECT ?, e.id FROM list_events e
       JOIN list_members m ON m.list_id = e.list_id AND m.user_id = ?
      WHERE e.id = ?`,[i,i,t])}async function x(e,i){return(await e.query(`SELECT o.product, o.unit, l.currency, o.kind, o.price,
            DATE_FORMAT(o.observed_on, '%Y-%m-%d') AS observed_on, o.item_id
       FROM price_observations o
       JOIN lists l ON l.id = o.list_id
      WHERE o.list_id IN (SELECT list_id FROM ${I} me WHERE me.user_id = ?)
      ORDER BY o.observed_on, o.id
      LIMIT 5000`,[i])).map(e=>({product:e.product,unit:e.unit,currency:e.currency,kind:e.kind,price:Number(e.price),observedOn:e.observed_on,itemId:null===e.item_id?null:Number(e.item_id)}))}e.s(["activeInvite",0,y,"changesFingerprint",0,A,"clearEvents",0,f,"createList",0,N,"dismissEvent",0,D,"eventsForUser",0,h,"itemsOfLists",0,T,"joinByInvite",0,S,"listByInvite",0,R,"listsForUser",0,u,"membership",0,a,"priceHistory",0,x,"refreshMemberName",0,_,"requireMember",0,l,"requireOwner",0,o,"rotateInvite",0,O,"snapshot",0,p,"statsInput",0,b,"suggestionRows",0,L,"touch",0,m],21513)}];

//# sourceMappingURL=plugins_shopping_src_1gi4-dv._.js.map