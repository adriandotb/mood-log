import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib.supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('mood_entries').insert(body).select('*').single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
