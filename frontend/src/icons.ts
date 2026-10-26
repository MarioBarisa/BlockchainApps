import house from '@iconify-icons/ph/house'
import compass from '@iconify-icons/ph/compass'
import user from '@iconify-icons/ph/user'
import sun from '@iconify-icons/ph/sun'
import moon from '@iconify-icons/ph/moon'
import wallet from '@iconify-icons/ph/wallet'
import sparkle from '@iconify-icons/ph/sparkle'
import usersThree from '@iconify-icons/ph/users-three'
import handCoins from '@iconify-icons/ph/hand-coins'
import caretDown from '@iconify-icons/ph/caret-down'
import magnifyingGlass from '@iconify-icons/ph/magnifying-glass'
import checkCircle from '@iconify-icons/ph/check-circle'
import copy from '@iconify-icons/ph/copy'
import signOut from '@iconify-icons/ph/sign-out'
import plugsConnected from '@iconify-icons/ph/plugs-connected'
import rocketLaunch from '@iconify-icons/ph/rocket-launch'
import storefront from '@iconify-icons/ph/storefront'
import heart from '@iconify-icons/ph/heart'
import shieldCheck from '@iconify-icons/ph/shield-check'
import coin from '@iconify-icons/ph/coin'
import gift from '@iconify-icons/ph/gift'
import tree from '@iconify-icons/ph/tree'
import lightning from '@iconify-icons/ph/lightning'
import notePencil from '@iconify-icons/ph/note-pencil'
import arrowRight from '@iconify-icons/ph/arrow-right'
import arrowUpRight from '@iconify-icons/ph/arrow-up-right'
import info from '@iconify-icons/ph/info'
import qrCode from '@iconify-icons/ph/qr-code'
import palette from '@iconify-icons/ph/palette'

// Ikone se uvoze pojedinacno da u bundle ne udje cijela kolekcija
export const icons = {
  house,
  compass,
  user,
  sun,
  moon,
  wallet,
  sparkle,
  'users-three': usersThree,
  'hand-coins': handCoins,
  'caret-down': caretDown,
  'magnifying-glass': magnifyingGlass,
  'check-circle': checkCircle,
  copy,
  'sign-out': signOut,
  'plugs-connected': plugsConnected,
  'rocket-launch': rocketLaunch,
  storefront,
  heart,
  'shield-check': shieldCheck,
  coin,
  gift,
  tree,
  lightning,
  'note-pencil': notePencil,
  'arrow-right': arrowRight,
  'arrow-up-right': arrowUpRight,
  info,
  'qr-code': qrCode,
  palette,
}

export type IconName = keyof typeof icons
