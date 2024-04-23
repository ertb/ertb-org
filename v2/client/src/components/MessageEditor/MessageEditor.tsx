import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './quill-bootstrap.css'
import './ql-container.css'
import { cn } from '@/lib/utils'

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline','strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
}

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote',
  'list', 'bullet', 'indent',
  'color', 'background',
  'link', 'image'
]

interface Props {
  value?: string
  onChange?: (v:string)=>void
  className?: string
}
export const MessageEditor = ({value, onChange, className}:Props) => {
  return (
    <div className={cn('ql-wrapper', className)}>
      <ReactQuill
        theme='snow'
        value={value}
        onChange={onChange}
        placeholder={'Write something awesome...'}
        modules={modules}
        formats={formats}
      />
    </div>
  )
}
