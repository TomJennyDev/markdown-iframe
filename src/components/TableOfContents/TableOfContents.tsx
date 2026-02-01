import { Paper, Text, ScrollArea, Stack, Anchor } from '@mantine/core';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  onItemClick: (id: string) => void;
  activeId?: string;
}

export function TableOfContents({ items, onItemClick, activeId }: TableOfContentsProps) {
  return (
    <Paper
      shadow="sm"
      p="md"
      style={{
        width: '250px',
        position: 'sticky',
        top: '80px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'auto',
        alignSelf: 'flex-start',
      }}
    >
      <Text fw={700} size="lg" mb="md">
        Table of Contents
      </Text>
      <ScrollArea>
        <Stack gap="xs">
          {items.map((item, index) => (
            <Anchor
              key={index}
              onClick={() => onItemClick(item.id)}
              style={{
                paddingLeft: `${(item.level - 1) * 20 + 8}px`,
                fontSize: item.level === 1 ? '0.95rem' : '0.875rem',
                fontWeight: item.id === activeId ? 700 : item.level === 1 ? 600 : 400,
                cursor: 'pointer',
                display: 'block',
                textDecoration: 'none',
                backgroundColor: item.id === activeId ? '#e7f5ff' : 'transparent',
                padding: `4px 8px 4px ${(item.level - 1) * 20 + 8}px`,
                borderRadius: '4px',
                marginLeft: '-8px',
                transition: 'all 0.2s ease',
              }}
              c={item.id === activeId ? 'blue.7' : 'blue'}
            >
              {item.text}
            </Anchor>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
