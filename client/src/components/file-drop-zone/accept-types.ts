import { Accept } from "react-dropzone"

// info from https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
export type AcceptType = ('image' | 'doc' | 'video' | 'audio')
export const acceptTypes = {
  'image': {
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
    'image/png': ['.png'],
    //'image/tiff': ['.tiff', '.tif'],
    //'image/webp': ['.webp'],
  },
  'doc': {
    //'text/css': ['.csv'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.oasis.opendocument.presentation': ['.odp'],
    'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
    'application/vnd.oasis.opendocument.text': ['.odt'],
    'application/pdf': ['.pdf'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    //'application/rtf': ['.rtf'],
    //'text/plain': ['.txt'],
    'application/vnd.ms-excel': ['.xls'],
    'application/application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  'video': {
    'video/mp4': ['.mp4'],
    'video/mpeg': ['.mpeg'],
    //'video/ogg': ['.ogv'],
    //'video/mp2t': ['.ts'],
    //'video/webm': ['.webm'],
    //'video/3gpp': ['.3gp'],
    //'video/3gpp2': ['.3g2'],
  },
  'audio' : {
    //'audio/aac': ['.aac'],
    //'audio/midi': ['.mid', '.midi'],
    //'audio/x-midi': ['.mid', '.midi'],
    'audio/mpeg': ['.mp3'],
    //'audio/ogg': ['.oga'],
    //'audio/opus': ['.opus'],
    'audio/wav': ['.wav'],
    //'audio/dwiwebmwav': ['.webm'],
    //'audio/3gpp': ['.3gp'],
    //'audio/3gpp2': ['.3g2'],
  }
}

export const acceptMessage = (accept:AcceptType|Accept|undefined, maxFiles=1) => {
  if (!accept) return undefined
  const files = (maxFiles == 1 ? 'file' : 'files')

  if (typeof accept == 'string') {
    const msg = {
      'image': 'PNG, JPEG, GIF, or SVG',
      'doc': 'PDF, Microsoft Office doc, or OpenOffice doc',
      'video': 'MP4 or MPEG',
      'audio': 'MP3 or WAV',
    }
    return `${msg[accept]} ${files}`
  }

  // list of extenstions (ie., ".pdf, .html, or .rtf")
  const ext = Object.values<string[]>(accept).reduce((a,x)=>{
    x.forEach(x=>a.push(x))
    return a
  },[])
  if (!ext.length) return undefined

  if (ext.length == 1) return `${ext[0]} ${files}`
  return ext.slice(0,-1).join(', ') + ' or ' + ext.slice(-1) + ` ${files}`
}