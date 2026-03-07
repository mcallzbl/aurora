package com.aurora.strategy.impl;

import com.aurora.mapper.ArticleMapper;
import com.aurora.model.dto.ArticleSearchDTO;
import com.aurora.strategy.SearchStrategy;
import com.aurora.util.ArticleSearchHighlightUtil;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service("mySqlSearchStrategyImpl")
public class MySqlFullTextSearchStrategyImpl implements SearchStrategy {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    @Qualifier("mySqlLikeSearchStrategyImpl")
    private SearchStrategy mySqlLikeSearchStrategy;

    @Override
    public List<ArticleSearchDTO> searchArticle(String keywords) {
        if (StringUtils.isBlank(keywords)) {
            return new ArrayList<>();
        }
        List<String> keywordList = ArticleSearchHighlightUtil.extractKeywords(keywords);
        String booleanKeywords = buildBooleanKeywords(keywordList);
        if (StringUtils.isBlank(booleanKeywords)) {
            return mySqlLikeSearchStrategy.searchArticle(keywords);
        }
        List<ArticleSearchDTO> articles = articleMapper.listArticlesByFullText(keywords.trim(), booleanKeywords);
        if (CollectionUtils.isEmpty(articles)) {
            return mySqlLikeSearchStrategy.searchArticle(keywords);
        }
        return articles.stream().map(item -> ArticleSearchDTO.builder()
                        .id(item.getId())
                        .articleTitle(ArticleSearchHighlightUtil.highlight(item.getArticleTitle(), keywordList))
                        .articleContent(ArticleSearchHighlightUtil.highlight(ArticleSearchHighlightUtil.buildSnippet(item.getArticleContent(), keywordList), keywordList))
                        .build())
                .collect(Collectors.toList());
    }

    private String buildBooleanKeywords(List<String> keywordList) {
        return keywordList.stream()
                .map(this::sanitizeKeyword)
                .filter(StringUtils::isNotBlank)
                .map(this::toBooleanToken)
                .distinct()
                .collect(Collectors.joining(" "));
    }

    private String sanitizeKeyword(String keyword) {
        return keyword.replaceAll("[+\\-<>()~*\"@]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String toBooleanToken(String keyword) {
        if (keyword.length() > 1) {
            return "+" + keyword + "*";
        }
        return keyword;
    }

}
