import type { Area } from 'react-easy-crop'

/**
 * 크롭 영역(픽셀)만큼 이미지를 잘라 정사각 File 로 반환.
 * react-easy-crop 의 croppedAreaPixels 를 canvas 로 그려 Blob → File.
 */
export async function getCroppedFile(
  imageSrc: string,
  area: Area,
  fileName = 'avatar.png',
  outputSize = 512,
): Promise<File> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들 수 없어요.')

  // 크롭 영역을 출력 크기(정사각)로 리샘플
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, outputSize, outputSize,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.92),
  )
  if (!blob) throw new Error('이미지를 처리하지 못했어요.')

  return new File([blob], fileName, { type: 'image/png' })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('이미지를 불러오지 못했어요.')))
    img.src = src
  })
}
