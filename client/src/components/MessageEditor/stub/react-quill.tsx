/*
 * ReactQuill is a stub.
 *
 * To use ReactQuill: 
 *   npm i react-quill
 *   rm src/components/MessageEditor/stub/react-quill.tsx
 * 
 * and change references in ../MessageEditor.tsx from './stub/react-quill' to 'react-quill'
 */

interface Props {
  theme: 'snow'
  value?: string
  onChange?: (v:string)=>void
  placeholder?: string
  modules: object
  formats: string[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ReactQuill = (_props:Props) => {
  throw new Error(`ReactQuill is a stub. It needs to be replaced.`)
}

export default ReactQuill