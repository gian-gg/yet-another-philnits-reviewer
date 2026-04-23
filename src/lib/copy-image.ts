export async function copyImageToClipboard(url: string): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard image write not supported in this browser")
  }

  const pngBlob = fetchAsPngBlob(url)

  await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])
}

async function fetchAsPngBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors", cache: "force-cache" })
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`)
  const blob = await res.blob()

  if (blob.type === "image/png") return blob

  return await reencodeAsPng(blob)
}

async function reencodeAsPng(blob: Blob): Promise<Blob> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.src = objectUrl
    await img.decode()

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable")
    ctx.drawImage(img, 0, 0)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/png"
      )
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
