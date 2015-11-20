set nocompatible              " be iMproved, required
filetype off                  " required

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
" alternatively, pass a path where Vundle should install plugins
"call vundle#begin('~/some/path/here')

" let Vundle manage Vundle, required
Plugin 'gmarik/Vundle.vim'

" The following are examples of different formats supported.
" Keep Plugin commands between vundle#begin/end.

"color
Bundle 'tomasr/molokai'

" Syntax and language improvements.
Bundle 'Glench/Vim-Jinja2-Syntax'

"auto complete
Bundle 'Valloric/YouCompleteMe'

Bundle 'scrooloose/nerdtree'

" All of your Plugins must be added before the following line
call vundle#end()            " required
filetype plugin indent on    " required
" To ignore plugin indent changes, instead use:
"filetype plugin on
"
" Brief help
" :PluginList       - lists configured plugins
" :PluginInstall    - installs plugins; append `!` to update or just :PluginUpdate
" :PluginSearch foo - searches for foo; append `!` to refresh local cache
" :PluginClean      - confirms removal of unused plugins; append `!` to auto-approve removal
"
" see :h vundle for more details or wiki for FAQ
" Put your non-Plugin stuff after this line


""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" vim setting
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
set t_Co=256
syntax on
colorscheme molokai
set shortmess=atI 
set showcmd         
set autoindent
set cindent
set tabstop=4
set softtabstop=4
set shiftwidth=4
set expandtab
set smarttab
set number
set cursorline
set history=1000
set hlsearch
set incsearch
set langmenu=zh_CNUTF-8
set helplang=cn
set cmdheight=2


"NERDTree setting
"open a NERDTree automatically when vim starts up
autocmd vimenter * NERDTree

"close vim if the only window left open is a NERDTree
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif


"for YouCompleteMe
"auto close preview window
"let g:ycm_autoclose_preview_window_after_completion = 1
"dont show preview window
set completeopt-=preview
let g:ycm_add_preview_to_completeopt = 0
