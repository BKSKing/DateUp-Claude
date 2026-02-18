// ============================================ 
// DATEUP - CONFIG FILE 
// ============================================ 
import { createClient } from '@supabase/supabase-js';

// ---------------------------- 
// SUPABASE KEYS 
// ---------------------------- 
const SUPABASE_URL = 'https://bnvutvxxotmcyzndubbu.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudnV0dnh4b3RtY3l6bmR1YmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzA1MTAsImV4cCI6MjA4NjkwNjUxMH0.d9oLjPy_ZKbm_U8fL_22yi1iJ8_yyKA6qP1LU5P8pro'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------- 
// CLOUDINARY KEYS 
// ---------------------------- 
export const CLOUDINARY_CLOUD_NAME = 'dkz6xlffj'; 
export const CLOUDINARY_UPLOAD_PRESET = 'dateup_unsigned'; 

// ---------------------------- 
// ONESIGNAL KEYS 
// ---------------------------- 
export const ONESIGNAL_APP_ID = '92310a39-d7ec-4835-a34f-ca592e44076d';

// Upload function - image ya pdf dono ke liye 
export const uploadToCloudinary = async (file) => { 
    const formData = new FormData(); 
    formData.append('file', file); 
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 

    const resourceType = file.type === 'application/pdf' ? 'raw' : 'image'; 
    const res = await fetch( 
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, 
        { method: 'POST', body: formData } 
    ); 

    if (!res.ok) throw new Error('Upload failed'); 
    const data = await res.json(); 
    return data.secure_url; 
};

