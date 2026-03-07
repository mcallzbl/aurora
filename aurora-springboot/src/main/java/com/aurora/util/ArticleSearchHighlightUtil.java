package com.aurora.util;

import com.baomidou.mybatisplus.core.toolkit.StringUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.aurora.constant.CommonConstant.POST_TAG;
import static com.aurora.constant.CommonConstant.PRE_TAG;

public final class ArticleSearchHighlightUtil {

    private static final int SNIPPET_PREFIX_LENGTH = 40;

    private static final int SNIPPET_SUFFIX_LENGTH = 80;

    private static final int DEFAULT_SNIPPET_LENGTH = 120;

    private ArticleSearchHighlightUtil() {
    }

    public static List<String> extractKeywords(String keywords) {
        if (StringUtils.isBlank(keywords)) {
            return Collections.emptyList();
        }
        List<String> keywordList = Arrays.stream(keywords.trim().split("\\s+"))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .distinct()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList();
        if (!keywordList.isEmpty()) {
            return keywordList;
        }
        return List.of(keywords.trim());
    }

    public static String buildSnippet(String source, List<String> keywordList) {
        if (StringUtils.isBlank(source)) {
            return source;
        }
        int firstMatchIndex = getFirstMatchIndex(source, keywordList);
        if (firstMatchIndex == -1) {
            return abbreviate(source, DEFAULT_SNIPPET_LENGTH);
        }
        int start = Math.max(0, firstMatchIndex - SNIPPET_PREFIX_LENGTH);
        int end = Math.min(source.length(), firstMatchIndex + getLongestKeywordLength(keywordList) + SNIPPET_SUFFIX_LENGTH);
        return source.substring(start, end);
    }

    public static String highlight(String source, List<String> keywordList) {
        if (StringUtils.isBlank(source) || keywordList.isEmpty()) {
            return source;
        }
        String target = source;
        for (String keyword : keywordList) {
            if (StringUtils.isBlank(keyword)) {
                continue;
            }
            Pattern pattern = Pattern.compile(Pattern.quote(keyword), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            Matcher matcher = pattern.matcher(target);
            StringBuffer buffer = new StringBuffer();
            while (matcher.find()) {
                matcher.appendReplacement(buffer, Matcher.quoteReplacement(PRE_TAG + matcher.group() + POST_TAG));
            }
            matcher.appendTail(buffer);
            target = buffer.toString();
        }
        return target;
    }

    private static int getFirstMatchIndex(String source, List<String> keywordList) {
        if (keywordList.isEmpty()) {
            return -1;
        }
        String lowerSource = source.toLowerCase(Locale.ROOT);
        int firstMatchIndex = Integer.MAX_VALUE;
        for (String keyword : keywordList) {
            if (StringUtils.isBlank(keyword)) {
                continue;
            }
            int currentIndex = lowerSource.indexOf(keyword.toLowerCase(Locale.ROOT));
            if (currentIndex != -1) {
                firstMatchIndex = Math.min(firstMatchIndex, currentIndex);
            }
        }
        return firstMatchIndex == Integer.MAX_VALUE ? -1 : firstMatchIndex;
    }

    private static int getLongestKeywordLength(List<String> keywordList) {
        return keywordList.stream().map(String::length).max(Integer::compareTo).orElse(0);
    }

    private static String abbreviate(String source, int maxLength) {
        if (source.length() <= maxLength) {
            return source;
        }
        return source.substring(0, maxLength);
    }

}
