import { Link } from './system'

export class Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}
