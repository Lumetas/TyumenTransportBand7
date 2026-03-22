install:
	zeus preview | tee install.log

build:
	zeus build

dev:
	zeus dev

genlocal:
	node genLocal.js
