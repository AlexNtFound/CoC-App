import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useLanguage } from '../../contexts/LanguageContext';
import { useThemeColor } from '../../hooks/useThemeColor';

interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleBook {
  name: string;
  chapters: number;
}

export default function BibleScreen() {
  const { t } = useLanguage();
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  // Bible books data
  const bibleBooks: BibleBook[] = [
    { name: 'Genesis', chapters: 50 },
    { name: 'Exodus', chapters: 40 },
    { name: 'Leviticus', chapters: 27 },
    { name: 'Numbers', chapters: 36 },
    { name: 'Deuteronomy', chapters: 34 },
    { name: 'Joshua', chapters: 24 },
    { name: 'Judges', chapters: 21 },
    { name: 'Ruth', chapters: 4 },
    { name: 'Matthew', chapters: 28 },
    { name: 'Mark', chapters: 16 },
    { name: 'Luke', chapters: 24 },
    { name: 'John', chapters: 21 },
    { name: 'Acts', chapters: 28 },
    { name: 'Romans', chapters: 16 },
    { name: 'Ephesians', chapters: 6 },
    { name: 'Philippians', chapters: 4 },
    { name: 'Revelation', chapters: 22 },
  ];

  useEffect(() => {
    loadChapter();
  }, [currentBook, currentChapter]);

  const loadChapter = () => {
    setLoading(true);
    // Mock Bible verses - replace with actual Bible API later
    setTimeout(() => {
      const mockVerses: BibleVerse[] = [];
      const verseCount = currentBook === 'John' && currentChapter === 3 ? 36 : 25; // John 3 has more verses
      
      for (let i = 1; i <= verseCount; i++) {
        let verseText = '';
        
        // Special verses for demo
        if (currentBook === 'John' && currentChapter === 3 && i === 16) {
          verseText = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
        } else if (currentBook === 'John' && currentChapter === 1 && i === 1) {
          verseText = "In the beginning was the Word, and the Word was with God, and the Word was God.";
        } else if (currentBook === 'Romans' && currentChapter === 8 && i === 28) {
          verseText = "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.";
        } else {
          verseText = `This is verse ${i} of ${currentBook} chapter ${currentChapter}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
        }
        
        mockVerses.push({
          id: `${currentBook}-${currentChapter}-${i}`,
          book: currentBook,
          chapter: currentChapter,
          verse: i,
          text: verseText
        });
      }
      
      setVerses(mockVerses);
      setLoading(false);
    }, 500);
  };

  const handleBookSelect = (book: BibleBook) => {
    setCurrentBook(book.name);
    setCurrentChapter(1);
    setShowBookPicker(false);
  };

  const handlePreviousChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const handleNextChapter = () => {
    const book = bibleBooks.find(b => b.name === currentBook);
    if (book && currentChapter < book.chapters) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert(t('bible.searchFeature'), `Searching for: "${searchQuery}"\n\n${t('bible.searchFeature')}`);
    }
  };

  const handleVersePress = (verse: BibleVerse) => {
    Alert.alert(
      t('bible.verseOptions'),
      `${verse.book} ${verse.chapter}:${verse.verse}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('bible.bookmark'), onPress: () => Alert.alert(t('bible.bookmarked'), t('bible.bookmarkFeature')) },
        { text: t('bible.share'), onPress: () => Alert.alert(t('bible.share'), t('bible.shareFeature')) }
      ]
    );
  };

  const renderVerse = ({ item }: { item: BibleVerse }) => (
    <TouchableOpacity
      style={[styles.verseContainer, { borderBottomColor: borderColor }]}
      onPress={() => handleVersePress(item)}
    >
      <View style={styles.verseNumberContainer}>
        <ThemedText style={styles.verseNumber}>{item.verse}</ThemedText>
      </View>
      <ThemedText style={styles.verseText}>{item.text}</ThemedText>
    </TouchableOpacity>
  );

  const renderBookPicker = () => (
    <FlatList
      data={bibleBooks}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.bookItem,
            { backgroundColor: cardBackground, borderBottomColor: borderColor }
          ]}
          onPress={() => handleBookSelect(item)}
        >
          <ThemedText style={styles.bookName}>{item.name}</ThemedText>
          <ThemedText style={styles.bookChapters}>{item.chapters} {t('bible.chapters')}</ThemedText>
        </TouchableOpacity>
      )}
      style={[styles.bookPicker, { backgroundColor }]}
    />
  );

  if (showBookPicker) {
    return (
      <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => setShowBookPicker(false)}>
            <ThemedText style={styles.backButton}>{t('bible.back')}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('bible.selectBook')}</ThemedText>
          <View style={{ width: 60 }} />
        </ThemedView>
        {renderBookPicker()}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header with back button */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButton}>← Home</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookSelector}
          onPress={() => setShowBookPicker(true)}
        >
          <ThemedText style={styles.bookTitle}>{currentBook}</ThemedText>
          <ThemedText style={styles.dropdownIcon}>▼</ThemedText>
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { borderColor, color: textColor }]}
          placeholder={t('bible.searchVerses')}
          placeholderTextColor={borderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <ThemedText style={styles.searchButtonText}>🔍</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Chapter Navigation */}
      <ThemedView style={styles.chapterNav}>
        <TouchableOpacity 
          style={[styles.navButton, { opacity: currentChapter === 1 ? 0.3 : 1 }]}
          onPress={handlePreviousChapter}
          disabled={currentChapter === 1}
        >
          <ThemedText style={styles.navButtonText}>{t('bible.prev')}</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.chapterTitle}>{t('bible.chapter')} {currentChapter}</ThemedText>
        
        <TouchableOpacity 
          style={[styles.navButton, { 
            opacity: bibleBooks.find(b => b.name === currentBook)?.chapters === currentChapter ? 0.3 : 1 
          }]}
          onPress={handleNextChapter}
          disabled={bibleBooks.find(b => b.name === currentBook)?.chapters === currentChapter}
        >
          <ThemedText style={styles.navButtonText}>{t('bible.next')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Verses */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>{t('bible.loading')}</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(item) => item.id}
          renderItem={renderVerse}
          style={styles.versesList}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  bookSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#45b7d1',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 14,
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#45b7d1',
    width: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#45b7d1',
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 16,
  },
  chapterNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: '#45b7d1',
    fontWeight: '500',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  versesList: {
    flex: 1,
  },
  verseContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    alignItems: 'flex-start',
  },
  verseNumberContainer: {
    marginRight: 12,
    minWidth: 30,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45b7d1',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
  bookPicker: {
    flex: 1,
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
  },
  bookChapters: {
    fontSize: 14,
    opacity: 0.6,
  },
});