var cheerio = require('gulp-cheerio'),
	fs = require('fs'),
	gulp = require('gulp'),
	gulpif = require('gulp-if'),
	path = require('path'),
	rename = require('gulp-rename'),
	svgmin = require('gulp-svgmin'),
	svgstore = require('gulp-svgstore'),
	replaceFillAttrWithClass = cheerio({
		run: function ($) {
			$('[fill]').removeAttr('fill').addClass('fill');
		},
		parserOptions: {
			xmlMode: true
		}
	}),
	insertInlineStyle = cheerio({
		run: function ($) {
			$('svg').prepend('<style>.fill {fill: currentColor;}</style>');
		},
		parserOptions: {
			xmlMode: true
		}
	});

function renameSvgFiles(folder) {
	return rename(function (filePath) {
		// Use `id="wds-company-logo-wikia"` for company/logo-wikia.svg
		filePath.basename = 'wds-' + folder + '-' + filePath.basename;
	});
}

function deduplicateIds(folder) {
	return function (file) {
		// Minify and make sure that we don't have duplicated ids in reusable elements
		// Id of <symbol> element is set by svgstore based on the filename, not here
		var prefix = folder + '-' + path.basename(file.relative, path.extname(file.relative));

		return {
			plugins: [{
				cleanupIDs: {
					prefix: prefix + '-',
					minify: true
				}
			}]
		}
	}
}

function getFolders(dir) {
	return fs.readdirSync(dir)
		.filter(function (file) {
			return fs.statSync(path.join(dir, file)).isDirectory();
		});
}

gulp.task('svg', function () {
	var svgRootDir = './assets',
		folders = getFolders(svgRootDir);

	return folders.map(function (folder) {
		return gulp
			.src(path.join(svgRootDir, folder, '/*.svg'))
			.pipe(renameSvgFiles(folder))
			.pipe(gulpif(folder === 'icons', replaceFillAttrWithClass))
			.pipe(svgmin(deduplicateIds(folder)))
			.pipe(svgstore({
				inlineSvg: true
			}))
			.pipe(gulpif(folder === 'icons', insertInlineStyle))
			.pipe(gulp.dest('dist'));
	});
});

gulp.task('default', ['svg']);
