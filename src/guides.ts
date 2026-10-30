export type GuideLocale = 'zh-CN' | 'en'

export interface GuideSection {
  heading: string
  paragraphs?: string[]
  steps?: string[]
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface GuidePage {
  group: string
  locale: GuideLocale
  slug: string
  title: string
  description: string
  keywords: string[]
  h1: string
  intro: string
  toolPath: string
  toolLabel: string
  sections: GuideSection[]
  faqs: GuideFaq[]
  related: { path: string; label: string }[]
  updated: string
}

export const guides: GuidePage[] = [
  {
    group: 'compress-200kb',
    locale: 'zh-CN',
    slug: 'tupian-yasuo-200kb',
    title: '图片怎么压缩到 200KB？尺寸、格式与批量处理步骤',
    description: '把 JPG、PNG 或 WebP 图片压缩到 200KB 的实用步骤，包括调整长边、质量、格式和批量处理，图片在浏览器本地完成。',
    keywords: ['图片压缩到200KB', '图片压缩', '批量压缩图片', '照片压缩大小', 'JPG压缩'],
    h1: '图片怎么压缩到 200KB？',
    intro: '先把「压缩质量」变成明确的文件体积目标：选择图片、设置 200KB、检查结果。全程在浏览器内完成，不需要先上传原图。',
    toolPath: '/batch',
    toolLabel: '打开批量图片压缩',
    sections: [
      {
        heading: '为什么只降低 JPG 质量不一定够',
        paragraphs: [
          '文件大小同时受像素尺寸、画面细节、格式和质量参数影响。高分辨率商品图即使把质量降得很低，也可能仍然超过 200KB；继续降低质量反而会让文字、边缘和细纹理损坏。',
          '更稳妥的顺序是先限制长边，再让编码器在目标体积内寻找合适的质量。如果图片需要展示在商品列表或文章卡片中，通常不需要保留远高于显示尺寸的像素。',
        ],
      },
      {
        heading: '压缩到 200KB 的步骤',
        steps: [
          '在批量处理工具中拖入一张或多张 JPG、PNG、WebP 或 AVIF 图片。',
          '选择“按目标体积压缩”，把目标设置为 200KB。',
          '需要统一展示尺寸时，同时设置长边或固定宽高；不要先盲目放大再压缩。',
          '导出后检查文件体积和关键区域，重点看文字、商品轮廓、皮肤渐变和透明边缘。',
        ],
      },
      {
        heading: '什么时候应该换格式',
        paragraphs: [
          '照片类内容通常优先 JPG 或 WebP。需要透明背景时用 PNG 或 WebP；如果目标平台支持 AVIF，可以在相同观感下获得更小体积，但要确认访客浏览器和上传系统兼容。',
          '把 PNG 照片直接改成 JPG 往往能明显减小体积，而把带透明通道的设计图强制转成 JPG 会失去透明背景。先确认交付要求，再选择格式。',
        ],
      },
      {
        heading: '隐私和性能边界',
        paragraphs: [
          '选择的本批图片在当前浏览器中解码和编码，不会进入图片上传接口。页面、字体和程序代码仍需联网下载。',
          '一次处理几十张高分辨率图片会占用内存和 CPU。低配手机建议分批处理，并在导出前保留原始文件。',
        ],
      },
    ],
    faqs: [
      { question: '压缩到 200KB 会明显损失画质吗？', answer: '取决于原图尺寸、细节和目标格式。优先适度缩小像素，再控制质量，通常比单纯压低质量更自然。' },
      { question: 'PNG 能无损压到 200KB 吗？', answer: '无法保证。无损压缩有下限；如果文件仍超标，需要缩小尺寸或改成 JPG/WebP 等有损格式。' },
      { question: '原图会被上传吗？', answer: '不会。图片在浏览器中处理；应用资源和 AI 模型仍可能从网络加载。' },
    ],
    related: [
      { path: '/exif', label: '发图前清除 EXIF 位置信息' },
      { path: '/cutout', label: '去除商品图背景' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'remove-photo-gps',
    locale: 'zh-CN',
    slug: 'shanchuxiaoxiang-gps',
    title: '照片 GPS 位置怎么删除？先查看再清理 EXIF',
    description: '查看照片中的 GPS、设备型号和拍摄时间，并了解如何删除 EXIF 元数据而不重新压缩画面。图片在浏览器本地处理。',
    keywords: ['删除照片位置', '照片GPS怎么删', 'EXIF删除', '清除拍摄地点', '照片隐私'],
    h1: '照片 GPS 位置怎么删除？',
    intro: '发照片前先确认文件里是否保留了拍摄地点、设备和时间。图盒可以读取这些字段，再直接移除元数据段，不重新编码图片像素。',
    toolPath: '/exif',
    toolLabel: '查看并清除照片信息',
    sections: [
      {
        heading: '相册看不到，不代表文件里没有',
        paragraphs: [
          '手机相机可能把 GPS、拍摄时间、设备型号、镜头信息和编辑软件写入 JPG、PNG、WebP 等文件的元数据。聊天应用、二手平台或公开相册如何处理这些信息并不完全一致。',
          '分享私人照片、证件照、住所或未公开商品图片前，检查 EXIF 是一项低成本的隐私操作。',
        ],
      },
      {
        heading: '查看和删除步骤',
        steps: [
          '拖入照片，查看 GPS、设备、时间和编辑软件等字段。',
          '确认哪些信息需要保留。方向字段通常应保留，否则竖拍照片可能显示方向错误。',
          '删除 EXIF、XMP、IPTC 和文本元数据。图盒直接裁剪容器中的对应数据段，不重新编码画面。',
          '导出后重新检查字段，尤其不要只看相册缩略图。',
        ],
      },
      {
        heading: '方向与 ICC 要不要保留',
        paragraphs: [
          '部分相机用 EXIF Orientation 表示旋转方向。如果删除方向但没有把像素真正转正，照片可能横躺。ICC Profile 则影响广色域图片的颜色解释，专业设计图和相机输出通常值得保留。',
          '如果发布平台会重新处理图片，最终效果仍可能变化。重要文件应先在目标平台预览。',
        ],
      },
      {
        heading: '这不是删除照片内容',
        paragraphs: [
          '清理元数据不会移除画面里可见的门牌、路牌、反光文字或证件号码。需要遮挡这些内容时，应使用马赛克或裁剪工具。',
          '照片在浏览器本地处理，不会被上传为图片文件；网页、字体和程序资源仍需要联网加载。',
        ],
      },
    ],
    faqs: [
      { question: '删掉 EXIF 会重新压缩照片吗？', answer: '支持的 JPG、PNG、WebP 和 GIF 会按容器结构移除元数据段，不重新编码像素。不支持的结构可能回退为重编码。' },
      { question: '为什么删除后还有位置信息？', answer: '位置可能出现在可见画面或其他非标准字段中。请同时检查画面内容、PNG 文本块和平台保存方式。' },
      { question: '保留方向安全吗？', answer: '方向通常不包含拍摄地点，但仍是元数据。是否保留取决于文件在其他软件中的旋转兼容性。' },
    ],
    related: [
      { path: '/annotate', label: '给截图和照片打码' },
      { path: '/batch', label: '批量压缩和统一尺寸' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'id-photo-blue',
    locale: 'zh-CN',
    slug: 'zhengjianzhao-huanlan-di',
    title: '证件照怎么换蓝底？尺寸、构图和文件大小检查',
    description: '证件照换蓝底的步骤：选择规格、抠图、自动构图、检查背景色和文件体积，并说明报名照片仍需以官方要求为准。',
    keywords: ['证件照换蓝底', '证件照制作', '一寸照片蓝底', '报名照片换底色', '证件照尺寸'],
    h1: '证件照怎么换蓝底？',
    intro: '先确认报名系统要求的尺寸、背景和文件大小，再用原图抠图换底。构图、文件体积和最终审核标准要分别检查。',
    toolPath: '/id-photo',
    toolLabel: '制作证件照',
    sections: [
      {
        heading: '先选对规格，再换颜色',
        paragraphs: [
          '一寸、二寸、身份证、签证和考试报名照的像素、比例、头部占比并不相同。背景颜色也不能代替规格；一张蓝底照片尺寸不对，仍然可能被报名系统拒绝。',
          '进入工具后先选择目标规格，再检查官方通知中的像素、毫米、KB 和背景要求。',
        ],
      },
      {
        heading: '换底与构图步骤',
        steps: [
          '上传正面、光线均匀、没有明显遮挡的手机照片。',
          '选择规格并启动人像抠图，模型首次加载需要下载资源。',
          '设置蓝色背景，检查发丝、肩膀和衣服边缘是否有残留背景。',
          '使用人脸定位结果微调头顶留白、面部居中和裁切比例。',
          '设置目标体积并导出；需要打印时再生成相纸排版。',
        ],
      },
      {
        heading: '常见失败原因',
        paragraphs: [
          '头发边缘与背景颜色接近、原图严重逆光、头部被裁切或佩戴遮挡物，都会降低自动抠图效果。不要为了弥补抠图问题而反复提高羽化，边缘会显得不自然。',
          '如果自动构图偏差，优先手动调整。最终是否合规仍由办理机构判断，工具不能保证审核通过。',
        ],
      },
      {
        heading: '本地处理说明',
        paragraphs: [
          '选中的证件照在浏览器内进行分割、构图和导出，不进入图片上传接口。AI 模型文件会在首次使用相应功能时下载，网络和低配手机可能造成等待。',
        ],
      },
    ],
    faqs: [
      { question: '蓝底有固定 RGB 值吗？', answer: '不同机构可能不同，常见是纯蓝或浅蓝背景。应以报名系统或办事机构发布的最新样例为准。' },
      { question: 'AI 换底后还需要检查什么？', answer: '检查尺寸、头部比例、背景是否均匀、文件体积，以及衣服和发丝边缘。' },
      { question: '打印排版能直接冲洗吗？', answer: '可生成 300 DPI 的相纸排版，但冲印店裁切和设备误差仍会影响最终尺寸，打印后应复核。' },
    ],
    related: [
      { path: '/cutout', label: '通用人像和商品抠图' },
      { path: '/upscale', label: '放大低分辨率照片' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'chat-long-image',
    locale: 'zh-CN',
    slug: 'liaotian-jietu-changtu',
    title: '聊天记录截图怎么拼成一张长图？避免重复和错位',
    description: '把多张聊天记录截图竖向拼成长图的步骤，包括排序、统一宽度、间距和隐私打码，图片只在浏览器本地处理。',
    keywords: ['聊天记录拼长图', '截图拼接', '多张截图拼长图', '长图拼接', '聊天截图'],
    h1: '聊天记录截图怎么拼成一张长图？',
    intro: '按阅读顺序导入截图，统一宽度并处理重叠区域。拼接完成后再打码，避免在上传或导出过程中遗漏隐私信息。',
    toolPath: '/collage/long',
    toolLabel: '打开长图拼接',
    sections: [
      {
        heading: '先截图再拼接',
        paragraphs: [
          '连续滚动截图时保留少量重叠内容，方便确认上下两张是否接得上。拼接前按时间顺序命名或排列，避免把回复放到提问前。',
          '截图里的头像、昵称、手机号、地址和二维码都可能是隐私信息，应在最终导出前统一处理。',
        ],
      },
      {
        heading: '拼接步骤',
        steps: [
          '把截图按从上到下的顺序拖入长图工具。',
          '选择竖向拼接，让图片宽度统一。',
          '把间距调小，去掉截图之间多余的白边。',
          '检查重复消息、时间戳和输入框边界是否错位。',
          '导出前打码或裁掉不需要公开的账号与联系方式。',
        ],
      },
      {
        heading: '超长截图为什么会失败',
        paragraphs: [
          '浏览器 Canvas 有最大边长和面积限制。截图数量太多或使用超高分辨率手机截图时，工具会按安全上限缩放，文字可能不如原图清晰。',
          '遇到这种情况，可以分成两条长图，或者先统一把单张截图缩到更适合阅读的宽度。',
        ],
      },
      {
        heading: '隐私提示',
        paragraphs: [
          '选中的截图在浏览器中拼接和导出，不会先被上传。拼接前最好清除不必要的私人内容，而不是只依赖聊天平台二次压缩。',
        ],
      },
    ],
    faqs: [
      { question: '截图宽度不一样能拼吗？', answer: '可以，长图工具会统一宽度，但原图比例差异太大时可能出现留白或轻微拉伸，建议先调整到相近宽度。' },
      { question: '为什么长图文字变模糊？', answer: '可能是超出浏览器画布上限后自动缩放，或截图本身被聊天软件压缩。' },
      { question: '拼接后能再去 EXIF 吗？', answer: '导出后的新图片通常由浏览器生成，但你仍可在发送前检查元数据，尤其是处理原始截图时。' },
    ],
    related: [
      { path: '/annotate', label: '给截图加箭头和马赛克' },
      { path: '/exif', label: '清除图片元数据' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'compress-200kb',
    locale: 'en',
    slug: 'compress-image-to-200kb',
    title: 'How to Compress an Image to 200KB Online',
    description: 'Compress JPG, PNG, or WebP images to a 200KB target with practical resize, format, quality, and batch-processing guidance. Images stay in your browser.',
    keywords: ['compress image to 200kb', 'reduce image size to 200kb', 'batch compress images', 'photo compressor', 'online image compressor'],
    h1: 'How to compress an image to 200KB',
    intro: 'Set a real file-size target instead of guessing at JPEG quality. Choose your images, enter 200KB, and check the result before exporting.',
    toolPath: '/en/batch',
    toolLabel: 'Open the batch compressor',
    sections: [
      {
        heading: 'Why lowering JPEG quality is not always enough',
        paragraphs: [
          'File size depends on pixel dimensions, image detail, format, metadata, and encoder quality. A high-resolution product photo can remain above 200KB even when quality is already visibly degraded.',
          'A more reliable workflow is to constrain the long edge first, then let the encoder find a quality level inside the target size. If the image is displayed at 800 pixels wide, retaining a 6000-pixel original may add bytes without visible value.',
        ],
      },
      {
        heading: 'Step by step',
        steps: [
          'Open the batch image processor and add JPG, PNG, WebP, or AVIF files.',
          'Choose target-size compression and enter 200KB.',
          'Optionally set the long edge or fixed dimensions for a consistent export size.',
          'Run the batch and inspect text, facial features, product edges, and transparent areas.',
          'Download individual files or the complete ZIP archive.',
        ],
      },
      {
        heading: 'Choose the right format',
        paragraphs: [
          'JPEG is usually a practical choice for photographs, while WebP can produce smaller files at similar perceived quality on supported platforms. Keep PNG or WebP when transparency is required. AVIF can be even smaller, but upload systems and older browsers may not support it.',
          'A PNG screenshot converted to JPEG may shrink dramatically, but transparency and crisp text can suffer. Match the format to the delivery requirement rather than optimising for file size alone.',
        ],
      },
      {
        heading: 'Local processing and limits',
        paragraphs: [
          'The selected image batch is decoded and encoded in your browser rather than uploaded to an image-processing server. The app, fonts, and dependencies still load over the network.',
          'Large batches consume memory and CPU. Process a smaller group on older phones, and keep the originals until the exported files have been reviewed.',
        ],
      },
    ],
    faqs: [
      { question: 'Will a 200KB image always look good?', answer: 'No. A detailed chart or a large photo can show compression artifacts at that size. Resize before reducing quality further.' },
      { question: 'Can I batch compress multiple files?', answer: 'Yes. Tubox accepts a batch and can return individual exports or a ZIP archive.' },
      { question: 'Are the images uploaded?', answer: 'Selected images are processed locally in the browser. Application and model resources still need a network connection.' },
    ],
    related: [
      { path: '/en/cutout', label: 'Remove a product-photo background' },
      { path: '/en/exif', label: 'Remove metadata before sharing' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'remove-photo-gps',
    locale: 'en',
    slug: 'remove-photo-metadata',
    title: 'How to Remove GPS and EXIF Data From a Photo',
    description: 'Check and remove photo location, device, timestamp, and other EXIF metadata without recompressing pixels. Supports JPG, PNG, WebP, and GIF.',
    keywords: ['remove photo metadata', 'remove GPS from photo', 'EXIF remover', 'delete location from photo', 'strip image metadata'],
    h1: 'How to remove GPS and EXIF data from a photo',
    intro: 'Inspect the file before you share it, then remove the metadata you do not need. Tubox strips supported metadata segments without re-encoding the image pixels.',
    toolPath: '/en/exif',
    toolLabel: 'Inspect and remove EXIF',
    sections: [
      {
        heading: 'A photo can contain more than the visible picture',
        paragraphs: [
          'Cameras and phones may store GPS coordinates, capture time, device model, serial number, editing software, and author information in a photo file. Some messaging and marketplace apps remove these fields; others preserve them.',
          'Checking metadata is especially useful before sharing photos of a home, a private event, an identity document, or an unreleased product.',
        ],
      },
      {
        heading: 'Check, remove, verify',
        steps: [
          'Load the image and review the GPS, camera, timestamp, software, and author fields.',
          'Decide whether to keep EXIF orientation and the ICC colour profile.',
          'Remove EXIF, XMP, IPTC, comments, and PNG text chunks.',
          'Export the cleaned file and inspect its metadata again.',
        ],
      },
      {
        heading: 'Why orientation and ICC profiles matter',
        paragraphs: [
          'Some cameras store rotation in EXIF rather than rotating the pixels. Removing orientation blindly can make a portrait photo appear sideways. An ICC profile describes a wider colour space and may be important for accurate colour.',
          'Both can be useful, but neither is required for every upload. Follow the receiving platform and production workflow.',
        ],
      },
      {
        heading: 'Metadata is not the whole privacy problem',
        paragraphs: [
          'Removing EXIF will not hide a street sign, address label, face, or account name visible in the image. Use crop, annotation, or pixelation where the content itself is private.',
          'The selected image remains on your device for this workflow. The website and application files still load from the network.',
        ],
      },
    ],
    faqs: [
      { question: 'Does metadata removal reduce image quality?', answer: 'For supported containers, the tool removes metadata segments without re-encoding pixels. Unsupported formats may require a re-encoded PNG fallback.' },
      { question: 'Can it remove metadata from multiple photos?', answer: 'Yes. JPG, PNG, WebP, and GIF files can be processed in a batch and downloaded as a ZIP.' },
      { question: 'Can I keep the capture date?', answer: 'The current tool removes metadata segments as a privacy workflow. Save any information you need before exporting.' },
    ],
    related: [
      { path: '/en/annotate', label: 'Pixelate private details in a screenshot' },
      { path: '/en/batch', label: 'Compress a batch for sharing' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'id-photo-2x2',
    locale: 'en',
    slug: 'passport-photo-2x2',
    title: 'Make a 2×2 Inch Passport Photo From a Phone Picture',
    description: 'Create a 2×2 inch US passport-style photo with background replacement, automatic framing, file-size checks, and a printable photo sheet.',
    keywords: ['2x2 passport photo', 'passport photo maker', 'US passport photo online', '2x2 photo print', 'ID photo from phone'],
    h1: 'Make a 2×2 inch passport photo from a phone picture',
    intro: 'Start with a straight, well-lit photo, select the 2×2 inch specification, then verify the head position, background, file size, and print layout.',
    toolPath: '/en/id-photo',
    toolLabel: 'Open the ID photo maker',
    sections: [
      {
        heading: 'Prepare the source photo',
        paragraphs: [
          'Use a front-facing photo with even lighting, a neutral expression, and no object covering the face. Avoid heavy beauty filters and strong shadows behind the head.',
          'A high-quality source gives the automatic face detection and background replacement more useful pixels. Check the latest official passport instructions before starting because crop and expression rules can change.',
        ],
      },
      {
        heading: 'Create and verify the photo',
        steps: [
          'Select the 2×2 inch passport specification and upload the source photo.',
          'Run the portrait cutout and choose the required background.',
          'Check head size, eye position, centring, and the space above the head.',
          'Adjust the crop manually if automatic framing does not match the official guide.',
          'Enter any file-size limit and export the photo.',
          'For printing, generate the photo sheet and verify the final physical dimensions with the print service.',
        ],
      },
      {
        heading: 'Common problems',
        paragraphs: [
          'Hair edges, glasses, loose clothing, and a background similar to the subject can create imperfect masks. Preview the result at 100% and correct obvious halos before export.',
          'A technically valid 2×2 inch file can still be rejected for expression, lighting, recent-photo, or identity requirements. The tool assists with image preparation; it cannot guarantee acceptance.',
        ],
      },
      {
        heading: 'What stays local',
        paragraphs: [
          'The selected portrait is processed in the browser. There is no image-upload endpoint. AI model files are downloaded when needed, which can make the first run slower on a new device.',
        ],
      },
    ],
    faqs: [
      { question: 'How many pixels is a 2×2 inch photo?', answer: 'There is no universal pixel count, but many digital upload systems ask for roughly 600×600 to 1200×1200 pixels. Use the exact requirement from the receiving authority.' },
      { question: 'Can I print several photos on one sheet?', answer: 'Yes. The print layout arranges multiple copies on a standard photo-paper sheet with crop guides.' },
      { question: 'Does automatic framing guarantee acceptance?', answer: 'No. It is a drafting aid. Official size, expression, recency, and background rules still apply.' },
    ],
    related: [
      { path: '/en/cutout', label: 'Remove a portrait background' },
      { path: '/en/upscale', label: 'Upscale a low-resolution portrait' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'instagram-grid',
    locale: 'en',
    slug: 'split-image-for-instagram-grid',
    title: 'How to Split an Image for an Instagram Grid',
    description: 'Split one image into a 3×3 Instagram grid, adjust the framing, preview gaps, and download numbered tiles in posting order.',
    keywords: ['split image for Instagram', 'Instagram grid maker', '3x3 photo splitter', 'Instagram puzzle feed', 'split image into 9'],
    h1: 'How to split an image for an Instagram grid',
    intro: 'Crop the source once, preview the tile gaps, and export numbered squares in the order you plan to post them.',
    toolPath: '/en/collage/nine',
    toolLabel: 'Split an image into a grid',
    sections: [
      {
        heading: 'Plan the grid before cutting',
        paragraphs: [
          'An Instagram profile grid displays images in rows, while posts can have other aspect ratios depending on where they appear. Start with a source image that has enough resolution and a composition that survives cuts through the middle.',
          'Keep faces, text, and high-contrast subjects away from tile boundaries. Preview the gaps rather than assuming the platform will display every file with zero spacing.',
        ],
      },
      {
        heading: 'Split and publish in order',
        steps: [
          'Upload the full composition to the grid splitter.',
          'Choose a 3×3 layout and tile ratio.',
          'Drag the source image to set the final crop.',
          'Preview the feed gaps and check the busiest details near boundaries.',
          'Export the numbered tiles as a ZIP archive.',
          'Prepare the posts in the required publishing order and verify the profile preview before publishing all tiles.',
        ],
      },
      {
        heading: 'Why the profile preview may differ',
        paragraphs: [
          'Different surfaces may crop or round images differently, and older posts can shift position when new rows are added. A 3×3 design is easier to manage than a large puzzle, but the first row still needs a coherent fallback.',
          'Use the profile preview after posting the first few tiles. If it does not match, remove or rearrange early tiles before publishing the whole set.',
        ],
      },
      {
        heading: 'Resolution and privacy',
        paragraphs: [
          'Keep the source long enough that each tile has enough pixels for the platform. Compression after upload can affect fine text and gradients.',
          'The source image is split in your browser and is not uploaded to a Tubox image endpoint.',
        ],
      },
    ],
    faqs: [
      { question: 'Can I split an Instagram Story instead?', answer: 'Yes. Choose the vertical triptych or another available layout and preview the target aspect ratio.' },
      { question: 'Which tile should I post first?', answer: 'File naming follows the reading order. Publish the top-left tile first and proceed left to right, top to bottom.' },
      { question: 'Why do the tiles look different on my profile?', answer: 'Profile grid previews and feed cards may use different crops. Always inspect the actual profile preview before continuing.' },
    ],
    related: [
      { path: '/en/collage/social', label: 'Create a social post layout' },
      { path: '/en/collage/grid', label: 'Combine several photos into a collage' },
    ],
    updated: '2026-10-30',
  },
  {
    group: 'video-gif-size',
    locale: 'en',
    slug: 'video-to-gif-file-size',
    title: 'How to Convert a Video to GIF and Control File Size',
    description: 'Convert a short MP4, WebM, or MOV clip to GIF while controlling duration, frame rate, resolution, crop, loop, and colour count.',
    keywords: ['video to GIF', 'MP4 to GIF', 'reduce GIF size', 'convert video to GIF online', 'MOV to GIF'],
    h1: 'How to convert a video to GIF and control file size',
    intro: 'GIF size grows quickly with duration, frame rate, resolution, and colour count. Change those variables deliberately instead of exporting the full clip at the highest settings.',
    toolPath: '/en/video-to-gif',
    toolLabel: 'Convert a video clip to GIF',
    sections: [
      {
        heading: 'Use a short, focused clip',
        paragraphs: [
          'Trim the video to the moment that communicates the result. A five-second clip can still be large, while a ten-second clip with hundreds of frames can become impractical for chat or help documentation.',
          'Choose a start and end point that contains a complete action. Avoid including unnecessary loading screens or dead time.',
        ],
      },
      {
        heading: 'Choose frame rate and size deliberately',
        steps: [
          'Load an MP4, WebM, or MOV file and select a short segment.',
          'Start around 10–15 fps for interface walkthroughs and use a lower frame rate for simple motion.',
          'Reduce the output width before lowering colour count further.',
          'Crop to the important interface or set a ratio that matches the destination.',
          'Preview the loop and export; compare the GIF size with the expected upload limit.',
        ],
      },
      {
        heading: 'When GIF is the wrong format',
        paragraphs: [
          'GIF has no modern video compression and is limited to 256 colours per frame in this workflow. Skin tones, gradients, and detailed video may show banding. For long clips, a silent MP4 or WebM is usually much smaller and clearer.',
          'Use GIF when autoplay compatibility, loopability, or simple embedding is more important than the best possible quality.',
        ],
      },
      {
        heading: 'Local conversion',
        paragraphs: [
          'The selected video is decoded by your browser and encoded locally. Large files and high frame rates can be slow on older devices, and the page itself still loads over the network.',
        ],
      },
    ],
    faqs: [
      { question: 'What settings make the smallest GIF?', answer: 'Use the shortest clip, lowest useful frame rate, smallest readable width, a tight crop, and fewer colours.' },
      { question: 'Why is the GIF jagged or distorted?', answer: 'A low colour count can create banding, while heavy resizing can damage fine details. Increase size or colours only after trimming the clip.' },
      { question: 'Does the video get uploaded?', answer: 'The selected video is processed in your browser and is not uploaded through a Tubox image endpoint.' },
    ],
    related: [
      { path: '/en/gif', label: 'Combine images into a GIF' },
      { path: '/en/collage/social', label: 'Create a thumbnail or cover image' },
    ],
    updated: '2026-10-30',
  },
]

export function guidePath(guide: GuidePage) {
  return guide.locale === 'en' ? `/en/guides/${guide.slug}/` : `/guides/${guide.slug}/`
}

export const guideIndexPath: Record<GuideLocale, string> = {
  'zh-CN': '/guides/',
  en: '/en/guides/',
}

export function guideAlternates(guide: GuidePage) {
  return guides.filter((candidate) => candidate.group === guide.group).map((candidate) => ({
    locale: candidate.locale,
    href: guidePath(candidate),
    lang: candidate.locale === 'en' ? 'en' : 'zh-CN',
  }))
}

