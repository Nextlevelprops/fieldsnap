// Image preparation and upload helpers
// Converts any image format (including HEIC) to JPEG via canvas

export function prepareImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const MAX = 1600
        let w = img.naturalWidth || img.width
        let h = img.naturalHeight || img.height
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Could not process image')); return }
          resolve({ blob, previewUrl: URL.createObjectURL(blob), width: w, height: h })
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.85)
      } catch (err) {
        reject(new Error('Could not process image: ' + err.message))
      }
    }

    img.onerror = () => {
      // Canvas approach failed — use file directly
      resolve({ blob: file, previewUrl: url, width: 0, height: 0 })
    }

    img.src = url
  })
}

export async function uploadPreparedImage(supabase, bucket, folder, prepared) {
  const path = `${folder}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, prepared.blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
