package com.aurora.strategy.impl;

import com.aurora.entity.Article;
import com.aurora.mapper.ArticleMapper;
import com.aurora.model.dto.ArticleSearchDTO;
import com.aurora.strategy.SearchStrategy;
import com.aurora.util.ArticleSearchHighlightUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.aurora.constant.CommonConstant.FALSE;
import static com.aurora.enums.ArticleStatusEnum.PUBLIC;

@Service("mySqlLikeSearchStrategyImpl")
public class MySqlSearchStrategyImpl implements SearchStrategy {

    @Autowired
    private ArticleMapper articleMapper;

    @Override
    public List<ArticleSearchDTO> searchArticle(String keywords) {
        if (StringUtils.isBlank(keywords)) {
            return new ArrayList<>();
        }
        List<String> keywordList = ArticleSearchHighlightUtil.extractKeywords(keywords);
        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getIsDelete, FALSE)
                .eq(Article::getStatus, PUBLIC.getStatus())
                .and(i -> i.like(Article::getArticleTitle, keywords)
                        .or()
                        .like(Article::getArticleContent, keywords)));
        return articles.stream().map(item -> ArticleSearchDTO.builder()
                        .id(item.getId())
                        .articleTitle(ArticleSearchHighlightUtil.highlight(item.getArticleTitle(), keywordList))
                        .articleContent(ArticleSearchHighlightUtil.highlight(ArticleSearchHighlightUtil.buildSnippet(item.getArticleContent(), keywordList), keywordList))
                        .build())
                .collect(Collectors.toList());
    }

}
