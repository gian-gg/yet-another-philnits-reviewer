export async function copyImageToClipboard(url: string): Promise<void> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = url
  await img.decode()

  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("2d context unavailable")
  ctx.drawImage(img, 0, 0)

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    )
  })

  await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])
}
