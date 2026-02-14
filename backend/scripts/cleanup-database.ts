#!/usr/bin/env node
/**
 * Database Cleanup Script
 *
 * Removes ghost profiles, duplicates, and orphaned data from Supabase
 * Run: npm run cleanup
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function cleanup() {
  console.log('🧹 Starting database cleanup...\n');

  const results = {
    guestProfilesDeleted: 0,
    profileEmailsDeleted: 0,
    orphanedMapsDeleted: 0,
    orphanedNodesDeleted: 0,
    orphanedEdgesDeleted: 0,
    errors: [] as string[],
  };

  try {
    // 1. Delete guest profiles (@guest.mindmap.local)
    console.log('🔍 Looking for guest profiles...');
    const { data: guestProfiles, error: guestError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .like('email', '%@guest.mindmap.local');

    if (guestError) {
      console.error('❌ Error fetching guest profiles:', guestError.message);
      results.errors.push(guestError.message);
    } else if (guestProfiles && guestProfiles.length > 0) {
      console.log(`   Found ${guestProfiles.length} guest profiles`);
      const guestIds = guestProfiles.map((p) => p.id);

      // Get maps created by guests
      const { data: guestMaps } = await supabase
        .from('maps')
        .select('id')
        .in('created_by', guestIds);

      if (guestMaps && guestMaps.length > 0) {
        const guestMapIds = guestMaps.map((m) => m.id);
        console.log(`   Found ${guestMapIds.length} maps to delete`);

        // Delete edges
        const { count: edgesDeleted } = await supabase
          .from('edges')
          .delete({ count: 'exact' })
          .in('map_id', guestMapIds);
        console.log(`   ↳ Deleted ${edgesDeleted || 0} edges`);

        // Delete nodes
        const { count: nodesDeleted } = await supabase
          .from('nodes')
          .delete({ count: 'exact' })
          .in('map_id', guestMapIds);
        console.log(`   ↳ Deleted ${nodesDeleted || 0} nodes`);

        // Delete maps
        const { count: mapsDeleted } = await supabase
          .from('maps')
          .delete({ count: 'exact' })
          .in('id', guestMapIds);
        console.log(`   ↳ Deleted ${mapsDeleted || 0} maps`);
      }

      // Delete activity events
      const { count: eventsDeleted } = await supabase
        .from('activity_events')
        .delete({ count: 'exact' })
        .in('user_id', guestIds);
      console.log(`   ↳ Deleted ${eventsDeleted || 0} activity events`);

      // Delete workspace memberships
      const { count: membershipsDeleted } = await supabase
        .from('workspace_members')
        .delete({ count: 'exact' })
        .in('user_id', guestIds);
      console.log(`   ↳ Deleted ${membershipsDeleted || 0} workspace memberships`);

      // Delete profiles
      const { count: profilesDeleted, error: deleteError } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .in('id', guestIds);

      if (deleteError) {
        console.error('❌ Error deleting profiles:', deleteError.message);
        results.errors.push(deleteError.message);
      } else {
        results.guestProfilesDeleted = profilesDeleted || 0;
        console.log(`✅ Deleted ${profilesDeleted} guest profiles\n`);
      }
    } else {
      console.log('✅ No guest profiles found\n');
    }

    // 2. Delete profile-based fallback emails (@profile.local)
    console.log('🔍 Looking for profile fallback emails...');
    const { data: profileEmails, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .like('email', '%@profile.local');

    if (profileError) {
      console.error('❌ Error fetching profile emails:', profileError.message);
      results.errors.push(profileError.message);
    } else if (profileEmails && profileEmails.length > 0) {
      console.log(`   Found ${profileEmails.length} profile fallback emails`);
      const profileIds = profileEmails.map((p) => p.id);

      // Get maps
      const { data: profileMaps } = await supabase
        .from('maps')
        .select('id')
        .in('created_by', profileIds);

      if (profileMaps && profileMaps.length > 0) {
        const profileMapIds = profileMaps.map((m) => m.id);
        console.log(`   Found ${profileMapIds.length} maps to delete`);

        // Delete edges
        const { count: edgesDeleted } = await supabase
          .from('edges')
          .delete({ count: 'exact' })
          .in('map_id', profileMapIds);
        console.log(`   ↳ Deleted ${edgesDeleted || 0} edges`);

        // Delete nodes
        const { count: nodesDeleted } = await supabase
          .from('nodes')
          .delete({ count: 'exact' })
          .in('map_id', profileMapIds);
        console.log(`   ↳ Deleted ${nodesDeleted || 0} nodes`);

        // Delete maps
        const { count: mapsDeleted } = await supabase
          .from('maps')
          .delete({ count: 'exact' })
          .in('id', profileMapIds);
        console.log(`   ↳ Deleted ${mapsDeleted || 0} maps`);
      }

      // Delete activity events
      const { count: eventsDeleted } = await supabase
        .from('activity_events')
        .delete({ count: 'exact' })
        .in('user_id', profileIds);
      console.log(`   ↳ Deleted ${eventsDeleted || 0} activity events`);

      // Delete workspace memberships
      const { count: membershipsDeleted } = await supabase
        .from('workspace_members')
        .delete({ count: 'exact' })
        .in('user_id', profileIds);
      console.log(`   ↳ Deleted ${membershipsDeleted || 0} workspace memberships`);

      // Delete profiles
      const { count: profilesDeleted, error: deleteError } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .in('id', profileIds);

      if (deleteError) {
        console.error('❌ Error deleting profiles:', deleteError.message);
        results.errors.push(deleteError.message);
      } else {
        results.profileEmailsDeleted = profilesDeleted || 0;
        console.log(`✅ Deleted ${profilesDeleted} profile fallback emails\n`);
      }
    } else {
      console.log('✅ No profile fallback emails found\n');
    }

    // 3. Clean orphaned maps
    console.log('🔍 Looking for orphaned maps...');
    const { data: allMaps } = await supabase.from('maps').select('id, created_by');
    const { data: validProfiles } = await supabase.from('profiles').select('id');

    if (allMaps && validProfiles) {
      const validProfileIds = new Set(validProfiles.map((p) => p.id));
      const orphanedMaps = allMaps.filter((m) => !validProfileIds.has(m.created_by));

      if (orphanedMaps.length > 0) {
        console.log(`   Found ${orphanedMaps.length} orphaned maps`);
        const orphanedMapIds = orphanedMaps.map((m) => m.id);

        // Delete edges
        const { count: edgesDeleted } = await supabase
          .from('edges')
          .delete({ count: 'exact' })
          .in('map_id', orphanedMapIds);
        results.orphanedEdgesDeleted = edgesDeleted || 0;
        console.log(`   ↳ Deleted ${edgesDeleted || 0} edges`);

        // Delete nodes
        const { count: nodesDeleted } = await supabase
          .from('nodes')
          .delete({ count: 'exact' })
          .in('map_id', orphanedMapIds);
        results.orphanedNodesDeleted = nodesDeleted || 0;
        console.log(`   ↳ Deleted ${nodesDeleted || 0} nodes`);

        // Delete maps
        const { count: mapsDeleted } = await supabase
          .from('maps')
          .delete({ count: 'exact' })
          .in('id', orphanedMapIds);
        results.orphanedMapsDeleted = mapsDeleted || 0;
        console.log(`✅ Deleted ${mapsDeleted} orphaned maps\n`);
      } else {
        console.log('✅ No orphaned maps found\n');
      }
    }

    // Summary
    console.log('📊 Cleanup Summary:');
    console.log(`   Guest profiles: ${results.guestProfilesDeleted}`);
    console.log(`   Profile emails: ${results.profileEmailsDeleted}`);
    console.log(`   Orphaned maps: ${results.orphanedMapsDeleted}`);
    console.log(`   Orphaned nodes: ${results.orphanedNodesDeleted}`);
    console.log(`   Orphaned edges: ${results.orphanedEdgesDeleted}`);
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.length}`);
      results.errors.forEach((err) => console.log(`      - ${err}`));
    }

    console.log('\n✅ Cleanup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
