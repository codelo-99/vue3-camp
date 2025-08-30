import { Link } from './system'

export class Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}

export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
  tracking: boolean
}
